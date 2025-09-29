const noblox = require("noblox.js");

exports.handler = async function(event, context) {
  // Store your cookie securely in environment variables!
  const cookie = process.env.HOLDER_RBLX_COOKIE;
  if (!cookie) {
    return {
      statusCode: 500,
      body: "Missing Holder Account cookie",
    };
  }

  try {
    await noblox.setCookie(cookie);
    const currentUser = await noblox.getCurrentUser();
    return {
      statusCode: 200,
      body: JSON.stringify(currentUser),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.toString(),
    };
  }
};
