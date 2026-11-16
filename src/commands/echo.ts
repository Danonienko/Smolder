import { INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE, MESSAGE_FLAG_EPHEMERAL, OPTION_TYPE_STRING, type ICommand } from './types';

/** Discord caps a message's content at 2000 characters, so the option is limited to the same length. */
const MAX_TEXT_LENGTH = 2000;

export const echo: ICommand = {
	name: 'echo',
	definition: {
		name: 'echo',
		description: 'Repeats the text you give it',
		options: [
			{
				type: OPTION_TYPE_STRING,
				name: 'text',
				description: 'The text to repeat',
				required: true,
				min_length: 1,
				max_length: MAX_TEXT_LENGTH,
			},
		],
	},
	async execute(interaction) {
		const option = interaction.data.options?.find((o) => o.name === 'text');
		if (!option || !('value' in option) || typeof option.value !== 'string') {
			return Response.json({
				type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
				data: { content: 'Give me some text to echo.', flags: MESSAGE_FLAG_EPHEMERAL },
			});
		}
		return Response.json({
			type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
			// Empty `parse` means mentions in the text (@everyone, @user, @role) don't ping anyone.
			data: { content: option.value, allowed_mentions: { parse: [] } },
		});
	},
};
