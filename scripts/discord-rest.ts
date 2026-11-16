/**
 * Shared helper for the command registration scripts. It runs in Node, not in the Worker.
 * Overwrites the registered slash commands with the bot's `commandList` using Discord's bulk overwrite endpoint.
 * https://docs.discord.com/developers/interactions/application-commands#bulk-overwrite-global-commands
 */
import { commandList } from '../src/commands';

/** Returns the value of an environment variable, or exits with a message if it is missing. */
export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Set ${name} in the environment before registering commands.`);
		process.exit(1);
	}
	return value;
}

/**
 * Replaces the commands in the given scope with `commandList`.
 * Without a guild id this registers global commands; with one, it registers commands for that guild only.
 */
export async function bulkOverwrite(guildId?: string): Promise<void> {
	const applicationId = requireEnv('DISCORD_APPLICATION_ID');
	const token = requireEnv('DISCORD_TOKEN');

	const scope = guildId ? `guild ${guildId}` : 'global';
	const path = guildId ? `applications/${applicationId}/guilds/${guildId}/commands` : `applications/${applicationId}/commands`;

	const definitions = commandList.map((command) => command.definition);

	const response = await fetch(`https://discord.com/api/v10/${path}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bot ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(definitions),
	});

	if (!response.ok) {
		console.error(`Discord rejected the ${scope} registration (${response.status}): ${await response.text()}`);
		process.exit(1);
	}

	console.log(`Registered ${definitions.length} ${scope} command(s): ${definitions.map((d) => d.name).join(', ')}`);
}
