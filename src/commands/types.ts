/**
 * Shared types for slash commands. Command modules import from here; the registry in `./index.ts` imports the commands.
 * Discord's API types come from `discord-api-types`, which is type-only here, so it adds nothing to the bundle.
 * https://docs.discord.com/developers/interactions/application-commands
 */
import type {
	APIChatInputApplicationCommandInteraction,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';

/*
 * Runtime values. The enums from `discord-api-types` are undefined under the Workers test runtime, so use these
 * plain constants instead. Values match the enums in `discord-api-types/v10`.
 */
export const INTERACTION_TYPE_APPLICATION_COMMAND = 2;
export const INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE = 4;
export const MESSAGE_FLAG_EPHEMERAL = 1 << 6;
export const OPTION_TYPE_STRING = 3;

/** An application command interaction (type 2) for a slash command. */
export type ApplicationCommandInteraction = APIChatInputApplicationCommandInteraction;

/** Body sent to Discord when registering a slash command (bulk overwrite endpoint). */
export type CommandDefinition = RESTPostAPIChatInputApplicationCommandsJSONBody;

/** Values a command can use while executing. `env` is only available per request, not at module scope. */
export interface CommandContext {
	env: Env;
	ctx: ExecutionContext;
}

export interface ICommand {
	readonly name: string;
	readonly definition: CommandDefinition;
	execute(interaction: ApplicationCommandInteraction, context: CommandContext): Promise<Response>;
}
