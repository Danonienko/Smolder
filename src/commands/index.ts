/**
 * Command registry. To add a command: create its module in this directory, then add it to `commandList` below.
 */
import { ping } from './ping';
import {
	type ApplicationCommandInteraction,
	type CommandContext,
	type ICommand,
	INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
	MESSAGE_FLAG_EPHEMERAL,
} from './types';

/** Every command the bot knows about. Also the source for registering commands with Discord. */
export const commandList: ICommand[] = [ping];

export const commands: Map<string, ICommand> = new Map(commandList.map((command) => [command.name, command]));

/** Routes an application command interaction to its command by name. */
export function dispatch(interaction: ApplicationCommandInteraction, context: CommandContext): Promise<Response> {
	const command = commands.get(interaction.data.name);
	if (!command) {
		return Promise.resolve(
			Response.json({
				type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
				data: { content: 'Unknown command.', flags: MESSAGE_FLAG_EPHEMERAL },
			}),
		);
	}
	return command.execute(interaction, context);
}
