export async function handler(event) {
  const CLIENT_ID = process.env.DISCORD_APPLICATION_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_APPLICATION_CLIENT_SECRET;
  const REDIRECT_URI = "https://area-55.netlify.app/.netlify/functions/callback";

  // Server-side config
  const CONFIGS = {
    eventcommittee: {
      guildId: "1359236692116242694", // evc server, SUBJECT TO CHANGE
      roleId: "null", // event committee, no role yet
      webhook: process.env.DISCORD_WEBHOOK_EVENTCOMMITTEE
    },
    gamemoderationteam: {
      guildId: "1359233219156906074", // gmt server
      roleId: "1380846654470623265", // game moderation team
      webhook: process.env.DISCORD_WEBHOOK_GAMEMODERATIONTEAM
    },
    serverstartuphosts: {
      guildId: "1414127185895227465", // SSUH Server
      roleId: "1415905687619506297", // server start up hosts
      webhook: process.env.DISCORD_WEBHOOK_SERVERSTARTUPDEPARTMENT
    },
    actingdepartment: {
      guildId: "1338393906374770740", // acting server
      roleId: "1338444679049379910", // acting department
      webhook: process.env.DISCORD_WEBHOOK_ACTINGDEPARTMENT
    },
    morphingdepartment: {
      guildId: "1403713920337707009", // morphing server
      roleId: "1404013149815967744", // morphing department
      webhook: process.env.DISCORD_WEBHOOK_MORPHINGDEPARTMENT
    }
    administration: {
    	guildId: "1413745795596812310", //overwatch server
			roleId: "1413746152121307246", //administrative role
			webhook: process.env.DISCORD_WEBHOOK_ADMINISTRATION
  	}
  };
  const globalWebhook = process.env.DISCORD_GLOBAL_WEBHOOK_LOG; // staff server access attempt log

  const code = event.queryStringParameters.code;
  const pageKey = event.queryStringParameters.state;

  if (!code || !pageKey || !CONFIGS[pageKey]) {
    return { statusCode: 400, body: "Invalid request" };
  }

  const { guildId, roleId, webhook } = CONFIGS[pageKey];

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        scope: "identify guilds guilds.members.read",
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return { statusCode: 400, body: "Failed to get access token" };

    // 2. Get user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userResponse.json();

    // 3. Check membership in the correct guild
    const memberResponse = await fetch(
      `https://discord.com/api/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (memberResponse.status !== 200) {
      await sendEmbed(user, false, webhook, pageKey);
      return { statusCode: 200, body: "User not in guild" };
    }

    const member = await memberResponse.json();
    const hasRole = member.roles.includes(roleId);

    // 4. Send webhook result
    // await sendEmbed(user, hasRole, webhook, pageKey); // temporarily removed
    await sendEmbed(user, hasRole, globalWebhook, pageKey);

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <script>
          sessionStorage.setItem("discord_access_token", "${accessToken}");
          window.location.href = "${hasRole ? `/staff_${pageKey}.html` : `/redirect.html`}";
        </script>
      `
    };


  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error occurred" };
  }
}

async function sendEmbed(user, success, webhookUrl, staffPanelKey) {
  const embed = {
    title: success ? "Success | Access Authorised" : "Failure | Access Blocked",
    description: success
      ? `${user.username}#${user.discriminator} has the required role.`
      : `${user.username}#${user.discriminator} does not have the role.`,
    color: success ? 0x00ff00 : 0xff0000,
    thumbnail: { url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` },
    author: {
      name: `${user.username}#${user.discriminator} attempted using the staff panel.`,
      icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    },
    footer: {
      text: `Staff Panel: ${staffPanelKey} • ${new Date().toLocaleString()}`
    }
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
