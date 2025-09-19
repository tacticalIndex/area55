// FILE USES SCP: ROLEPLAY IN-GAME ADDON. SUBJECT TO CHANGE.
exports.handler = async function(event, context) {
  // REPLACE CONSTANT BELOW WITH YOUR ENVIRONMENT VARIABLE/SECRET KEY. MAKE SURE IT'S HIDDEN, AS ANYBODY WITH ACCESS TO THE URL WILL SEE IT IF IT ISN'T HIDDEN DURING PROXY PRODUCTION.
  const discordWebhook = process.env.DISCORD_WEBHOOK_INGAMEKILLLOGS;
  // REPLACE ABOVE CONSTANT WITH YOUR ENVIRONMENT VARIABLE/SECRET KEY. MAKE SURE IT'S HIDDEN, AS ANYBODY WITH ACCESS TO THE URL WILL SEE IT IF IT ISN'T HIDDEN DURING PROXY PRODUCTION.
  if (!discordWebhook) {
    return {
      statusCode: 500,
      body: "Discord webhook URL not configured."
    };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch(discordWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: body.content })
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: `Discord webhook error: ${response.statusText}`
      };
    }

    return {
      statusCode: 200,
      body: "Message sent to Discord successfully."
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Error: ${error.message}`
    };
  }
};
