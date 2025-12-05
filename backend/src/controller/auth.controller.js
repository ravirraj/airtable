import axios from "axios";
import { User } from "../models/User.model.js";

function setSessionCookie(res, userId) {
  res.cookie("uId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
}

function clearSessionCookie(res) {
  res.clearCookie("session_token");
}

async function startOAuth(req, res) {
  const clientId = process.env.AIRTABLE_CLENT_ID;
  const redirectUri = `${process.env.BASE_URL}/auth/airtable/callback`;
   const scope = 'data.records:read data.records:write bases:read'
  const authUrl = `https://airtable.com/oauth2/v1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}`;


  console.log(authUrl)
  console.log(redirectUri)

    try {
        res.redirect(authUrl);
    } catch (error) {
        return res.status(500).send("Error initiating OAuth flow");
        console.log(error)
    }
}

async function handleOAuthCallback(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  try {
    const tokenResponse = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      {
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.AIRTABLE_CLENT_ID,
        client_secret: process.env.AIRTABLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BASE_URL}/auth/airtable/callback`,
      },
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (tokenResponse.status !== 200) {
      return res.status(500).send("Failed to exchange code for token");
    }

    const data = tokenResponse.data;
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in;
    const airtableUserId = data.user_id;
    const email = data.email;
    const name = data.username || null;

    try {
      const meta = await axios.get("https://api.airtable.com/v0/meta/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (
        meta.data &&
        Array.isArray(meta.data.bases) &&
        meta.data.bases.length > 0
      )
        airtableUserId = meta.data.bases[0].id;
    } catch (err) {
      console.warn("meta fetch failed", err.message);
    }

    let user = User.findOne({ airtablUserId });

    if (!user) {
      user = new User({
        airtableUserId,
        name,
        email,
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
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return res.status(500).send("Failed to exchange code for token");
  }
}

async function logout(req, res) {
  clearSessionCookie(res);
  return res.json({ message: "Logged out successfully" });
}


export {startOAuth , handleOAuthCallback , logout}