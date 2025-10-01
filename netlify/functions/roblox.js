exports.handler = async function(event, context) { return { statusCode: 410 body: "Service Deprecated." } }

/*const noblox = require("noblox.js");

// group id hardcoded
const GROUP_ID = 34847172;

exports.handler = async function(event, context) {
  const requiredHeader = "x-custom-auth";
  const requiredValue = process.env.CUSTOM_AUTH_SECRET;

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  // Check auth header
  const incomingHeader = event.headers[requiredHeader];
  if (incomingHeader !== requiredValue) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Forbidden: Invalid authentication header." })
    };
  }

  // Check cookie
  const cookie = process.env.ROBLOX_COOKIE;
  if (!cookie) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Roblox cookie not set" })
    };
  }

  let username, rank, discord, discordId;
  try {
    const body = JSON.parse(event.body || "{}");
    username = body.username;
    rank = Number(body.rank);
    discord = body.discorduser;
    discordId = body.discordId;

    if (!(username && rank)) {
      throw new Error("Missing username or rank");
    }
  } catch (e) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: e.message })
    };
  }

  try {
    await noblox.setCookie(cookie);
    const userId = await noblox.getIdFromUsername(username);
    const roles = await noblox.getRoles(GROUP_ID);
    const roleObj = roles.find(r => r.rank === rank);
    const roleName = roleObj ? roleObj.name : "Unknown Role";

    await noblox.setRank(GROUP_ID, userId, rank);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        username,
        userId,
        groupId: GROUP_ID,
        rank,
        roleName,
        discord,
        discordId,
        message: `Changed role for ${username} ([${userId}](https://roblox.com/users/${userId}/profile)) in group [${GROUP_ID}](https://www.roblox.com/communities/${GROUP_ID}/about) to "${roleName}" (Rank ID: ${rank}).`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};*/