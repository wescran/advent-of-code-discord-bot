# Advent of Code Discord Bot

### Purpose
The purpose of this bot is to be able to pull private leaderboard information from the Advent of Code website. There are 3 commands that can be used with the bot to pull the information and display the results in the configured channel. The bot also runs on a cron schedule so that a link to each advent puzzle will be posted.

### Configuration
This bot is built to be hosted on Cloudflare Workers. There is a free tier that I am currently using for this bot. Before you start, you will need to have created a bot. The developer portal for Discord has some great guides on setting up the bot. I used [this tutorial](https://discord.com/developers/docs/tutorials/hosting-on-cloudflare-workers) to help me.

#### Cloudflare specific settings
Be sure to adjust the settings within the `wrangler.toml` to match your Cloudflare account.
- `account_id` can be found in your account dashboard
- `workers_dev` should only be set to `true` if you are using the `*.workers.dev` subdomain
- `kv_namespaces` is the Workers KV store used to cache requests to the Advent of Code endpoint. Leave the binding as is, but the `id` and `preview_id` will need to be changed. See the [docs](https://developers.cloudflare.com/workers/wrangler/workers-kv/#create-a-kv-namespace-with-wrangler)

#### Secrets
There are a number of secrets needed to run this bot. This is where Wrangler comes in. Wrangler is Cloudfalre's CLI tool for interacting with your Workers. By running the command `wrangler put secret <KEY>` you can create secret values for your Workers to use. For more info on this see [the Cloudflare docs](https://developers.cloudflare.com/workers/platform/environment-variables/#adding-secrets-via-wrangler) 

From Discord will need:
- `DISCORD_TOKEN` which you get after creating the bot
- `DISCORD_PUBLIC_KEY` which you get after creating the bot
- `DISCORD_APPLICATION_ID` which you get after creating the bot
- `DISCORD_CHANNEL_ID` which you get from whatever text channel you wish to have the bot message in.

From Cloudflare you will need:
- `CLOUDFLARE_TOKEN` for Github Actions, see [here](https://developers.cloudflare.com/workers/wrangler/ci-cd/#create-a-cloudflare-api-token)

From Advent of Code you will need:
- `ADVENT_OWNER_ID` needed for querying the private leaderboard. Just go to your leaderboard (Leaderboard -> Private Leaderboard -> View -> Use digits from last part of URL). Example URL `https://adventofcode.com/2022/leaderboard/private/view/**450140**`
- `ADVENT_SESSION` this is the session cookie for your login needed to query the JSON data. You can obtain this by using the developer tools in the browser.

#### Environment Variables
Along with the secrets, there are some environment variables that will need to be configured for the bot as well. Theses can be configured in the `wrangler.toml` file under `[vars]`. See [docs](https://developers.cloudflare.com/workers/platform/environment-variables/#environment-variables-via-wrangler`) for more info

- `ADVENT_YEAR` the year for which you want stats from

### Deployment
Before deploying the bot, you should run the `./src/register.js` script locally in order to register your commands. Be sure to include the proper secrets when running the script. 
```
$ DISCORD_TOKEN=**** DISCORD_APPLICATION_ID=**** node src/register.js
```
Once configured, you can run `wrangler publish` or `npm run deploy` or use Github Actions to deploy your Worker. Once this is configured, you can use the domain of your worker for the interactions URL in the Discord bot settings. Once updated, add your bot to your desired channel and try out some of the commands!
