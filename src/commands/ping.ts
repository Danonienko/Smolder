import { INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE, type ICommand } from './types';

export const ping: ICommand = {
	name: 'ping',
	definition: {
		name: 'ping',
		description: 'Replies with Pong!',
	},
	async execute() {
		return Response.json({
			type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
			data: { content: 'Pong!' },
		});
	},
};
