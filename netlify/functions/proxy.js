export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { team, payload, startImage, endImage } = body;

    // Retrieve Cloudinary credentials from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials not set");
    }

    // Function to upload base64 image to Cloudinary
    async function uploadToCloudinary(base64, public_id_suffix) {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const timestamp = Math.floor(Date.now() / 1000);
      const payloadData = {
        file: `data:image/png;base64,${base64}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, 
        // if using unsigned preset; or use signature for signed uploads
        // If signed: you compute signature of params + api_secret
        // but for simplicity, using an unsigned preset
        public_id: `scp_shift_${public_id_suffix}_${timestamp}`
      };

      const res = await fetch(url, {
        method: "POST",
        body: new URLSearchParams(payloadData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
      }

      return data.secure_url;  
    }

    // Upload start / end if provided
    let startLink = null;
    let endLink = null;

    if (startImage) {
      startLink = await uploadToCloudinary(startImage, "start");
    }

    if (endImage) {
      endLink = await uploadToCloudinary(endImage, "end");
    }

    // Add image links into embed
    // You can add them in the description or fields
    if (!payload.embeds) {
      payload.embeds = [];
    }
    // If embed[0] exists, attach links
    if (payload.embeds[0]) {
      if (startLink) {
        payload.embeds[0].description += `\n**Start Screenshot:** ${startLink}`;
      }
      if (endLink) {
        payload.embeds[0].description += `\n**End Screenshot:** ${endLink}`;
      }
    }

    // Map teams to Discord webhook URLs
    const webhookMap = {
      SERVERSTARTUPDEPARTMENT: process.env.DISCORD_WEBHOOK_SERVERSTARTUPDEPARTMENT,
      GAMEMODERATIONTEAM: process.env.DISCORD_WEBHOOK_GAMEMODERATIONTEAM,
      ACTINGDEPARTMENT: process.env.DISCORD_WEBHOOK_ACTINGDEPARTMENT,
      EVENTCOMMITTEE: process.env.DISCORD_WEBHOOK_EVENTCOMMITTEE,
      MORPHINGDEPARTMENT: process.env.DISCORD_WEBHOOK_MORPHINGDEPARTMENT
    };

    const webhookUrl = webhookMap[team];

    if (!webhookUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid team selected" })
      };
    }

    // Send to Discord
    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await discordRes.text();
    return {
      statusCode: discordRes.status,
      body: text
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}