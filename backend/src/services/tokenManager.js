import axios from "axios";

function buildReqHeader() {
  const encoded = Buffer.from(
    `${AIRTABLE_CLIENT_ID}:${AIRTABLE_CLIENT_SECRET}`
  ).toString("base64");
  return `Basic ${encoded}`;
}

async function refreshAirtableToken(user) {
  if (!user || !user.refreshToken) {
    throw new Error("Invalid user or missing refresh token");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: user.refreshToken,
  }).toString();

  const headers = {
    Authorization: buildReqHeader(),
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const res = await axios.post("https://airtable.com/oauth2/v1/token", body, {
      headers,
    });

    const data = res.data;

    user.accessToken = data.access_token;
    if (data.refresh_token) {
      user.refreshToken = data.refresh_token;
    }

    user.tokenExpiry = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

    await user.save();

    return user.accessToken;
  } catch (error) {
    console.error("Error refreshing Airtable token:", error);
    throw error;
  }
}

async function getValidAirtableToken(user) {
  if (!user) throw new Error("User missing");

  const now = Date.now();
  const expiryTime = user.tokenExpiry
    ? new Date(user.tokenExpiry).getTime()
    : null;

  if (!expiryTime || now > expiryTime - 60 * 1000) {
    return await refreshAirtableToken(user);
  }

  return user.accessToken;
}
export { refreshAirtableToken, getValidAirtableToken };
