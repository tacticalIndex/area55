const noblox = require("noblox.js");

exports.handler = async function(event, context) {
  const cookie = process.env.ROBLOX_COOKIE;
  if (!cookie) {
    return { statusCode: 500, body: "Roblox cookie not set" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let groupId, username, rank;
  try {
    const body = JSON.parse(event.body || "{}");
    groupId = Number(body.groupId);
    username = body.username;
    rank = Number(body.rank);
    if (!(groupId && username && rank)) throw new Error("Missing groupId, username, or rank");
  } catch (e) {
    return { statusCode: 400, body: e.message };
  }

  try {
    await noblox.setCookie(cookie);
    // 1. Get userId from username
    const userId = await noblox.getIdFromUsername(username);
    // 2. Set the user's rank in the group
    await noblox.setRank(groupId, userId, rank);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        username,
        userId,
        groupId,
        rank,
        message: `Changed role for ${username} (${userId}) in group ${groupId} to rank ${rank}.`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};