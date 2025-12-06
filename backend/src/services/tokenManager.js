import axios from "axios";

function buildReqHeader() {
  const encoded = Buffer.from(
    `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
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
  console.log("kya ye user aa rha haaaai?????",user)
  if (!user) throw new Error("User missing");
  const now = Date.now();
  const expiryTime = user.tokenExpiry
  console.log("thissssssssssssssss",expiryTime)
    ? new Date(user.tokenExpiry).getTime()
    : null;

  // console.log("NOW (ms):", now);
  // console.log("NOW (ISO):", new Date(now).toISOString());

  // console.log("RAW tokenExpiry from DB:", user.tokenExpiry);
  // console.log("expiryTime (ms):", expiryTime);

  // if (expiryTime) {
  //   console.log("expiryTime (ISO):", new Date(expiryTime).toISOString());
  //   console.log(
  //     "expiryTime - 60s (ISO):",
  //     new Date(expiryTime - 60 * 1000).toISOString()
  //   );
  // }

  // console.log("Should refresh?:", !expiryTime || now > expiryTime - 60 * 1000);

  if (!expiryTime || now > expiryTime - 60 * 1000) {
    return await refreshAirtableToken(user);
  }

  return user.accessToken;
}
export { refreshAirtableToken, getValidAirtableToken };
