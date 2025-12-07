import axios from "axios";
import { User } from "../models/User.model.js";
import crypto from "crypto";

function setSessionCookie(res, userId) {
  res.cookie("uId", userId, {
    httpOnly: true,

    // secure: process.env.NODE_ENV === "production",
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    //this is not working idk why so..
    // signed: true,
  });
}

function clearSessionCookie(res) {
  res.clearCookie("uId", {
    httpOnly: true,
    //this is not working idk why
    // signed: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

async function startOAuth(req, res) {
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL}/auth/airtable/callback`;
  const state = crypto.randomBytes(100).toString("base64url");
  const codeVerifier = crypto.randomBytes(96).toString("base64url");
  const scope =
    "data.records:read data.records:write schema.bases:read schema.bases:write";
  const codeChallengeMethod = "S256";
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  res.cookie("airtable_oauth", JSON.stringify({ state, codeVerifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const authUrl = `https://airtable.com/oauth2/v1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(
    scope
  )}&state=${state}&code_challenge=${encodeURIComponent(
    codeChallenge
  )}&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`;

  try {
    res.redirect(authUrl.toString());
  } catch (error) {
    return res.status(500).send("Error initiating OAuth flow");
  }
}

async function handleOAuthCallback(req, res) {
  const encodedCredentials = Buffer.from(
    `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
  ).toString("base64");

  const authorizationHeader = `Basic ${encodedCredentials}`;
  const { code, state } = req.query;

  if (req.query.error) {
    console.log(req.query.error_description || req.query.error);

    return res
      .status(400)
      .send(`OAuth Error: ${req.query.error_description || req.query.error}`);
  }

  console.log("Authorization code received:", JSON.stringify(code));
  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  let stored;

  try {
    stored = req.cookies.airtable_oauth
      ? JSON.parse(req.cookies.airtable_oauth)
      : null;
  } catch {
    stored = null;
  }

  if (!stored || !stored.codeVerifier || !stored.state) {
    return res.status(400).send("Missing PKCE data (state / verifier)");
  }

  if (stored.state !== state) {
    return res.status(400).send("Invalid state (possible CSRF)");
  }
  const codeVerifier = stored.codeVerifier;
  const redirectUri = `${process.env.BASE_URL}/auth/airtable/callback`;

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString();

    const tokenResponse = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authorizationHeader,
        },
      }
    );
    console.log("Token response:", tokenResponse.data);

    if (tokenResponse.status !== 200) {
      console.error("Failed to exchange code for token:", tokenResponse.data);
      return res.status(500).send("Failed to exchange code for token");
    }

    const data = tokenResponse.data;
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in;
    let airtableUserId = null;

    try {
      const meta = await axios.get("https://api.airtable.com/v0/meta/whoami", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (
        meta.data &&
        Array.isArray(meta.data.scopes) &&
        meta.data.scopes.length > 0
      )
        airtableUserId = meta.data.id;
    } catch (err) {
      console.warn("meta fetch failed", err);
    }

    let user = await User.findOne({ airtableUserId });

    if (!user) {
      user = new User({
        airtableUserId,
        refreshToken,
        accessToken,
        tokenExpiry: new Date(Date.now() + expiresIn * 1000),
      });
    } else {
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      user.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    }
    await user.save();

    setSessionCookie(res, user._id);
    console.log("User logged in:", user._id);
    return res.redirect("http://localhost:5173");
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return res.status(500).send("Failed to exchange code for token");
  }
}

async function logout(req, res) {
  clearSessionCookie(res);
  return res.json({ message: "Logged out successfully" });
}

export { startOAuth, handleOAuthCallback, logout };
