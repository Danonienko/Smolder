import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";
import { commandList, commands } from "../src/commands";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const toHex = (buf: ArrayBuffer) =>
	[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

let privateKey: CryptoKey;
let testEnv: typeof env;

beforeAll(async () => {
	const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
		"sign",
		"verify",
	])) as CryptoKeyPair;
	privateKey = pair.privateKey;
	const publicKeyHex = toHex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
	testEnv = { ...env, DISCORD_PUBLIC_KEY: publicKeyHex };
});

async function signedRequest(body: string) {
	const timestamp = "1700000000";
	const signature = await crypto.subtle.sign("Ed25519", privateKey, new TextEncoder().encode(timestamp + body));
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

function commandInteraction(name: string) {
	return JSON.stringify({
		type: 2,
		id: "1",
		application_id: "2",
		token: "token",
		data: { id: "3", name },
	});
}

describe("command registry", () => {
	it("has one entry per command, keyed by its name", () => {
		expect(commands.size).toBe(commandList.length);
		for (const command of commandList) {
			expect(commands.get(command.name)).toBe(command);
		}
	});

	it("keeps each Discord definition name in line with the command name", () => {
		for (const command of commandList) {
			expect(command.definition.name).toBe(command.name);
		}
	});
});

describe("application command dispatch", () => {
	it("runs the ping command", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(await signedRequest(commandInteraction("ping")), testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 4, data: { content: "Pong!" } });
	});

	it("answers an unknown command with an ephemeral message", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(await signedRequest(commandInteraction("nope")), testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			type: 4,
			data: { content: "Unknown command.", flags: 64 },
		});
	});
});
