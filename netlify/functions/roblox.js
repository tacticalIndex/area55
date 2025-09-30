const noblox = require("noblox.js");

// group id hardcoded
const GROUP_ID = 34847172;

exports.handler = async function(event, context) {
  const requiredHeader = "x-custom-auth";
  const requiredValue = process.env.CUSTOM_AUTH_SECRET;

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const incomingHeader = event.headers[requiredHeader];
  if (incomingHeader !== requiredValue) {
    return { statusCode: 403, body: "Forbidden: Invalid authentication header." };
  }

  const cookie = process.env.ROBLOX_COOKIE;
  if (!cookie) {
    return { statusCode: 500, body: "Roblox cookie not set" };
  }

  let username, rank, discord, discordId;
  try {
    const body = JSON.parse(event.body || "{}");
    username = body.username;
    rank = Number(body.rank);
    discord = body.discorduser;
    discordId = body.discordId;

    if (!(username && rank &&)) {
      throw new Error("Missing username, rank");
    }
  } catch (e) {
    return { statusCode: 400, body: e.message };
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
      body: JSON.stringify({
        success: true,
        username,
        userId,
        groupId: GROUP_ID,
        rank,
        roleName,
        discord,
        discordId,
        message: `Changed role for ${username} (${userId}) in group ${GROUP_ID} to "${roleName}" (rank ${rank}). Linked to Discord user ${discord} (${discordId}).`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message, discord, discordId })
    };
  }
};