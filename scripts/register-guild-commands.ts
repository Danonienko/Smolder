/**
 * Registers the bot's slash commands for a single guild (server). Guild commands update immediately,
 * so this is the one to use while developing.
 * Run with `pnpm register:guild`. Reads DISCORD_APPLICATION_ID, DISCORD_TOKEN, and DISCORD_GUILD_ID.
 * Guild commands replace the global ones in that server only, so run `pnpm register` to update the global set.
 */
import { bulkOverwrite, requireEnv } from './discord-rest';

async function main(): Promise<void> {
	await bulkOverwrite(requireEnv('DISCORD_GUILD_ID'));
}

main();
