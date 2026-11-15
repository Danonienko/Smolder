/**
 * Discord interactions endpoint.
 *
 * Discord sends every interaction as a signed HTTP POST. We must:
 * - verify the Ed25519 signature on every request (401 if invalid)
 * - answer PING (type 1) with PONG (type 1)
 *
 * The application public key comes from the Developer Portal, set as `DISCORD_PUBLIC_KEY`.
 * https://docs.discord.com/developers/interactions/overview#preparing-for-interactions
 */

const INTERACTION_TYPE_PING = 1;
const INTERACTION_RESPONSE_TYPE_PONG = 1;

function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
		throw new Error('Invalid hex string');
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Verifies a Discord request signature. Returns the raw body if valid, or null if not.
 * The body must be read as raw text: the signature covers `timestamp + body` exactly as sent.
 */
async function verifyDiscordRequest(request: Request, publicKeyHex: string): Promise<string | null> {
	const signature = request.headers.get('X-Signature-Ed25519');
	const timestamp = request.headers.get('X-Signature-Timestamp');
	if (!signature || !timestamp) {
		return null;
	}

	const body = await request.text();
	try {
		const key = await crypto.subtle.importKey('raw', hexToBytes(publicKeyHex), { name: 'Ed25519' }, false, ['verify']);
		const valid = await crypto.subtle.verify(
			'Ed25519',
			key,
			hexToBytes(signature),
			new TextEncoder().encode(timestamp + body),
		);
		return valid ? body : null;
	} catch {
		// Malformed hex or key/signature of the wrong length: treat as an invalid request.
		return null;
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { status: 405 });
		}

		const body = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
		if (body === null) {
			return new Response('invalid request signature', { status: 401 });
		}

		const interaction = JSON.parse(body) as { type: number };

		if (interaction.type === INTERACTION_TYPE_PING) {
			return Response.json({ type: INTERACTION_RESPONSE_TYPE_PONG });
		}

		// No application commands are implemented yet.
		return new Response('Interaction type not implemented', { status: 501 });
	},
} satisfies ExportedHandler<Env>;
