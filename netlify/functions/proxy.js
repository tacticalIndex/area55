// contact me on discord (@choppovm) if I leaked any secret keys/webhooks (silly me!)
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { team, payload, startImage, endImage } = JSON.parse(event.body);

    // Map team names to environment variables (Discord webhooks)
    const webhookMap = {
      // O5COUNCIL: process.env.DISCORD_WEBHOOK_O5COUNCIL, // not compatible as of now
      // FACTIONSHUBSTAFF: process.env.DISCORD_WEBHOOK_FACTIONSHUBSTAFF, // not compatible as of now
      SERVERSTARTUPDEPARTMENT: process.env.DISCORD_WEBHOOK_SERVERSTARTUPDEPARTMENT,
      // DEVELOPMENTTEAM: process.env.DISCORD_WEBHOOK_DEVELOPMENTTEAM, // not compatible as of now
      // DISCORDMODERATIONTEAM: process.env.DISCORD_WEBHOOK_DISCORDMODERATIONTEAM, // not compatible as of now
      GAMEMODERATIONTEAM: process.env.DISCORD_WEBHOOK_GAMEMODERATIONTEAM,
      // LOREDEPARTMENT: process.env.DISCORD_WEBHOOK_LOREDEPARTMENT, // not compatible as of now
      ACTINGDEPARTMENT: process.env.DISCORD_WEBHOOK_ACTINGDEPARTMENT,
      EVENTCOMMITTEE: process.env.DISCORD_WEBHOOK_EVENTCOMMITTEE,
      MORPHINGDEPARTMENT: process.env.DISCORD_WEBHOOK_MORPHINGDEPARTMENT
      // APPEALSANDREPORTSTEAM: process.env.DISCORD_WEBHOOK_APPEALSANDREPORTSTEAM // not compatible as of now
    };

    const webhookUrl = webhookMap[team];
    if (!webhookUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid team" })
      };
    }

    // Upload helper → Imgur
    async function uploadToImgur(base64) {
      const response = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: base64 })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.data?.error || "Imgur upload failed");
      }

      return data.data.link;
    }

    // Handle screenshots (upload to Imgur if provided)
    const images = [];
    if (startImage) {
      const url = await uploadToImgur(startImage);
      images.push({ name: "Start Screenshot", url });
    }
    if (endImage) {
      const url = await uploadToImgur(endImage);
      images.push({ name: "End Screenshot", url });
    }

    // Add image links into the embed
    if (images.length > 0) {
      payload.embeds[0].fields = images.map(img => ({
        name: img.name,
        value: img.url
      }));
    }

    // Send to Discord
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return {
      statusCode: response.status,
      body: await response.text()
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}