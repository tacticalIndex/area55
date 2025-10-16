import { use } from "react";

export async function handler(event) {
  const CONFIGS = {
    eventcommittee: {
      guildId: "1359236692116242694", // evc server, SUBJECT TO CHANGE
      roleId: "null", // event committee, no role yet
    },
    gamemoderationteam: {
      guildId: "1359233219156906074", // gmt server
      roleId: "1380846654470623265", // game moderation team
    },
    serverstartuphosts: {
      guildId: "1414127185895227465", // SSUH Server
      roleId: "1415905687619506297", // server start up hosts
    },
    actingdepartment: {
      guildId: "1338393906374770740", // acting server
      roleId: "1338444679049379910", // acting department
    },
    morphingdepartment: {
      guildId: "1403713920337707009", // morphing server
      roleId: "1404013149815967744", // morphing department
    },
    administration: {
      guildId: "1413745795596812310", //overwatch server
      roleId: "1413746152121307246", //administration role
    },
    botOwner: {
      guildId: "1413744931918450861", // main server
      userId: "1162183562519384074", //index's DUID
    }
  };

  const authHeader = event.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verified: false, error: "Missing or invalid Authorization header"
      })
    };
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  const pageKey = event.queryStringParameters.pageKey;
  if (!pageKey || !CONFIGS[pageKey]) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verified: false, error: "Invalid pageKey"
      })
    };
  }

  const { guildId, roleId } = CONFIGS[pageKey];

  try {
    // 1. Fetch member info
    const memberResponse = await fetch(
      `https://discord.com/api/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!memberResponse.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: false })
      };
    }
    
    const member = await memberResponse.json();

    // 2. Fetch user info for username
    const userResponse = await fetch(
      "https://discord.com/api/users/@me",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let username = null;
    if (userResponse.ok) {
      const user = await userResponse.json();
      if (user.discriminator === 0) {
        username = `${user.username}`;
      } else {
        username = `${user.username}#${user.discriminator}`;
      }
    }

    
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const rolesResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}/roles`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    let highestRole = null;
    if (rolesResponse.ok && Array.isArray(member.roles)) {
      const roles = await rolesResponse.json();
      // ilter to members roles and sort by position descending
      const memberRoles = roles.filter(r => member.roles.includes(r.id));
      if (memberRoles.length) {
        memberRoles.sort((a, b) => b.position - a.position);
        highestRole = memberRoles[0].name;
      }
    }

    const hasRole = Array.isArray(member.roles) && member.roles.includes(roleId);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verified: hasRole,
        username,
        highestRole
      })
    };
  } catch (err) {
    console.error("Verification error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verified: false, error: "Internal server error"
      })
    };
  }
}