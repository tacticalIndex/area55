const noblox = require("noblox.js");

// group id hardcoded
const GROUP_ID = 34847172;

exports.handler = async function(event, context) {
  //Can only access if the x-custom-auth header contains the secret (put in a netlify env)
  const requiredHeader = "x-custom-auth";
  const requiredValue = process.env.CUSTOM_AUTH_SECRET; // Change to your actual secret

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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let username, rank;
  try {
    const body = JSON.parse(event.body || "{}");
    username = body.username;
    rank = Number(body.rank);
    if (!(username && rank)) throw new Error("Missing username or rank");
  } catch (e) {
    return { statusCode: 400, body: e.message };
  }

  try {
    await noblox.setCookie(cookie);
    // get user id from username (duh)
    const userId = await noblox.getIdFromUsername(username);

    // fetch all roles in the group to find the role name
    const roles = await noblox.getRoles(GROUP_ID);
    // find the role name within the group
    const roleObj = roles.find(r => r.rank === rank);
    const roleName = roleObj ? roleObj.name : "Unknown Role";

    // set the user's rank
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
        message: `Changed role for ${username} (${userId}) in group ${GROUP_ID} to "${roleName}" (rank ${rank}).`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};