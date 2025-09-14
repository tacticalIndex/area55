// proxy.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { team, payload, startImage, endImage } = JSON.parse(event.body);

    // Cloudinary setup
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    async function uploadBase64(base64, filename) {
      if (!base64) return null;

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();
      formData.append("file", `data:image/png;base64,${base64}`);
      formData.append("upload_preset", "shift_manager"); // Must create in Cloudinary
      formData.append("public_id", filename);

      const resp = await fetch(url, { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
      return data.secure_url;
    }

    // Upload images
    const startUrl = await uploadBase64(startImage, `start_${Date.now()}`);
    const endUrl = await uploadBase64(endImage, `end_${Date.now()}`);

    // Append image URLs to description
    if (startUrl) payload.embeds[0].description += `\n**Start Screenshot:** ${startUrl}`;
    if (endUrl) payload.embeds[0].description += `\n**End Screenshot:** ${endUrl}`;

    // Send Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const webhookResp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!webhookResp.ok) {
      const text = await webhookResp.text();
      throw new Error(text);
    }

    return { statusCode: 200, body: "Webhook sent!" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}