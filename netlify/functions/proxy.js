export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405, body: "Method Not Allowed"
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400, body: "Invalid JSON"
    };
  }

  const { team, payload, startImage, endImage } = body;

  const webhookMap = {
    SERVERSTARTUPDEPARTMENT: process.env.DISCORD_WEBHOOK_SERVERSTARTUPDEPARTMENT,
    GAMEMODERATIONTEAM: process.env.DISCORD_WEBHOOK_GAMEMODERATIONTEAM,
    ACTINGDEPARTMENT: process.env.DISCORD_WEBHOOK_ACTINGDEPARTMENT,
    EVENTCOMMITTEE: process.env.DISCORD_WEBHOOK_EVENTCOMMITTEE,
    MORPHINGDEPARTMENT: process.env.DISCORD_WEBHOOK_MORPHINGDEPARTMENT,
    ADMINISTRATION: process.env.DISCORD_WEBHOOK_ADMINISTRATION
  };

  const webhookUrl = webhookMap[team];
  if (!webhookUrl) return {
    statusCode: 400, body: "Unknown team"
  };

  async function uploadToCloudinary(base64, public_id_suffix) {
    if (!base64) return null;
    const form = new FormData();
    form.append("file", `data:image/png;base64,${base64}`);
    form.append("upload_preset", "shift_manager");
    if (public_id_suffix) 
      form.append("public_id", public_id_suffix);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: form
    });

    const data = await res.json();
    return data.secure_url || null;
  }

  try {
    const startLink = await uploadToCloudinary(startImage, `shift_start_${Date.now()}`);
    const endLink = await uploadToCloudinary(endImage, `shift_end_${Date.now()}`);

    if (startLink) payload.embeds[0].description += `\n**Start Screenshot:** ${startLink}`;
    if (endLink) payload.embeds[0].description += `\n**End Screenshot:** ${endLink}`;

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const globalRes = await fetch(process.env.DISCORD_GLOBAL_WEBHOOK_LOG, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return {
        statusCode: 500, body: `Team Discord error: ${text}`
      };
    }
    
    if (!globalRes.ok) {
      const text = await globalRes.text();
      return {
        statusCode: 500, body: `Global Webhook error: ${text}`
      };
    }

    return {
      statusCode: 200, body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500, body: `Server error: ${err.message}`
    };
  }
}