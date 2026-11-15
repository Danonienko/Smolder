import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const toHex = (buf: ArrayBuffer) =>
	[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

let privateKey: CryptoKey;
let publicKeyHex: string;
let testEnv: typeof env;

beforeAll(async () => {
	const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
		"sign",
		"verify",
	])) as CryptoKeyPair;
	privateKey = pair.privateKey;
	publicKeyHex = toHex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
	testEnv = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };
});

async function signedRequest(body: string, { timestamp = "1700000000", signWith = privateKey } = {}) {
	const signature = await crypto.subtle.sign(
		"Ed25519",
		signWith,
		new TextEncoder().encode(timestamp + body),
	);
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

describe("Discord interactions endpoint", () => {
	it("answers a signed PING with PONG", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			await signedRequest(JSON.stringify({ type: 1 })),
			testEnv,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 1 });
	});

	it("rejects a request with an invalid signature", async () => {
		const other = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
			"sign",
			"verify",
		])) as CryptoKeyPair;
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			await signedRequest(JSON.stringify({ type: 1 }), { signWith: other.privateKey }),
			testEnv,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
	});

	it("rejects a request whose body was altered after signing", async () => {
		const signed = await signedRequest(JSON.stringify({ type: 1 }));
		const tampered = new IncomingRequest("https://example.com", {
			method: "POST",
			headers: signed.headers,
			body: JSON.stringify({ type: 2 }),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(tampered, testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
	});

	it("rejects a request with missing signature headers", async () => {
		const response = await SELF.fetch("https://example.com", {
			method: "POST",
			body: JSON.stringify({ type: 1 }),
		});
		expect(response.status).toBe(401);
	});

	it("rejects non-POST methods", async () => {
		const response = await SELF.fetch("https://example.com");
		expect(response.status).toBe(405);
	});
});
