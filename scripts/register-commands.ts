/**
 * Registers the bot's slash commands as global commands. They are available in every server the bot is in,
 * but Discord can take up to an hour to propagate changes. For instant updates while developing, use
 * `pnpm register:guild` instead.
 * Run with `pnpm register`. Reads DISCORD_APPLICATION_ID and DISCORD_TOKEN (the bot token, not the public key).
 */
import { bulkOverwrite } from './discord-rest';

async function main(): Promise<void> {
	await bulkOverwrite();
}

main();
