import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { team, payload, startImage, endImage } = JSON.parse(event.body);

    const clientId = process.env.IMGUR_CLIENT_ID;

    async function uploadToImgur(base64) {
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${clientId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64, type: "base64" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Imgur upload failed");
      return data.data.link;
    }

    // Upload screenshots if available
    let startLink = null, endLink = null;
    if (startImage) startLink = await uploadToImgur(startImage);
    if (endImage) endLink = await uploadToImgur(endImage);

    // Enhance embed with screenshots
    if (startLink) payload.embeds[0].description += `\n**Start Screenshot:** ${startLink}`;
    if (endLink)   payload.embeds[0].description += `\n**End Screenshot:** ${endLink}`;

    // Webhook map
    const webhookMap = {
      SERVERSTARTUPDEPARTMENT: process.env.DISCORD_WEBHOOK_SERVERSTARTUPDEPARTMENT,
      GAMEMODERATIONTEAM: process.env.DISCORD_WEBHOOK_GAMEMODERATIONTEAM,
      ACTINGDEPARTMENT: process.env.DISCORD_WEBHOOK_ACTINGDEPARTMENT,
      EVENTCOMMITTEE: process.env.DISCORD_WEBHOOK_EVENTCOMMITTEE,
      MORPHINGDEPARTMENT: process.env.DISCORD_WEBHOOK_MORPHINGDEPARTMENT,
    };

    const webhookUrl = webhookMap[team];
    if (!webhookUrl) return {
      statusCode: 400, body: "Invalid team"
    };

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return { statusCode: discordRes.status, body: await discordRes.text() };
  } catch (err) {
    return { statusCode