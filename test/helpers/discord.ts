import { env } from "cloudflare:test";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
export const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const toHex = (buf: ArrayBuffer) =>
	[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Generates a fresh Ed25519 keypair and returns an env whose DISCORD_PUBLIC_KEY matches it,
 * plus a helper that signs request bodies the way Discord does.
 */
export async function createSigner() {
	const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
		"sign",
		"verify",
	])) as CryptoKeyPair;
	const publicKeyHex = toHex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
	const testEnv: typeof env = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };

	async function signedRequest(body: string) {
		const timestamp = "1700000000";
		const signature = await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(timestamp + body));
		return new IncomingRequest("https://example.com", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Signature-Ed25519": toHex(signature),
				"X-Signature-Timestamp": timestamp,
			},
			body,
		});
	}

	return { testEnv, signedRequest };
}

/** Builds the JSON body of an application command interaction (type 2). */
export function commandInteraction(name: string, options?: unknown[]) {
	return JSON.stringify({
		type: 2,
		id: "1",
		application_id: "2",
		token: "token",
		data: { id: "3", name, ...(options ? { options } : {}) },
	});
}
