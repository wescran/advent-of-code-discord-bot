/**
 * The core server that runs on a Cloudflare worker.
 */

import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { LEADERBOARD_COMMAND, STATS_COMMAND, USERS_COMMAND, INVITE_COMMAND } from './commands.js';
import { getLeaderboard, getStats, getUsers } from './aoc.js';
import { sendMessage } from './message.js';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

/**
 * Handle GET requests - simple health check
 */
function handleGet(env) {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
}

/**
 * Handle POST requests from Discord
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
async function handlePost(request, env) {
  const message = await request.json();
  console.log(message);
  
  if (message.type === InteractionType.PING) {
    console.log('Handling Ping request');
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    // IS_COMPONENTS_V2 flag = 1 << 15 = 32768
    const IS_COMPONENTS_V2 = 32768;

    switch (message.data.name.toLowerCase()) {
      case LEADERBOARD_COMMAND.name.toLowerCase(): {
        console.log('handling leaderboard request');
        const leaderboard = await getLeaderboard(env);
        return new JsonResponse({
          type: 4,
          data: {
            flags: IS_COMPONENTS_V2,
            components: leaderboard,
          },
        });
      }
      case STATS_COMMAND.name.toLowerCase(): {
        console.log('handling stats request');
        const stats = await getStats(env, message.data.options[0].value);
        return new JsonResponse({
          type: 4,
          data: {
            flags: IS_COMPONENTS_V2,
            components: stats,
          },
        });
      }
      case USERS_COMMAND.name.toLowerCase(): {
        console.log('handling users request');
        const users = await getUsers(env);
        return new JsonResponse({
          type: 4,
          data: {
            flags: IS_COMPONENTS_V2,
            components: users,
          },
        });
      }
      case INVITE_COMMAND.name.toLowerCase(): {
        const applicationId = env.DISCORD_APPLICATION_ID;
        const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
        return new JsonResponse({
          type: 4,
          data: {
            content: INVITE_URL,
            flags: 64, // Ephemeral
          },
        });
      }
      default:
        console.error('Unknown Command');
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }

  console.error('Unknown Type');
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Only handle requests to root path
    if (url.pathname !== '/') {
      return new Response('Not Found.', { status: 404 });
    }

    // Handle GET - health check
    if (request.method === 'GET') {
      return handleGet(env);
    }

    // Handle POST - Discord interactions
    if (request.method === 'POST') {
      // Verify request came from Discord
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');
      console.log(signature, timestamp, env.DISCORD_PUBLIC_KEY);
      const body = await request.clone().arrayBuffer();
      const isValidRequest = verifyKey(
        body,
        signature,
        timestamp,
        env.DISCORD_PUBLIC_KEY
      );
      if (!isValidRequest) {
        console.error('Invalid Request');
        return new Response('Bad request signature.', { status: 401 });
      }
      return handlePost(request, env);
    }

    return new Response('Method Not Allowed.', { status: 405 });
  },
  
  async scheduled(controller, env, ctx) {
    console.log("Initiating cron trigger task");
    ctx.waitUntil(sendMessage(controller, env));
  },
};
