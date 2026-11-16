import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../../src/index";
import { commandInteraction, createSigner } from "../helpers/discord";

let signer: Awaited<ReturnType<typeof createSigner>>;

beforeAll(async () => {
	signer = await createSigner();
});

describe("/echo", () => {
	it("echoes the text option back", async () => {
		const ctx = createExecutionContext();
		const body = commandInteraction("echo", [{ name: "text", type: 3, value: "hello there" }]);
		const response = await worker.fetch(await signer.signedRequest(body), signer.testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			type: 4,
			data: { content: "hello there", allowed_mentions: { parse: [] } },
		});
	});

	it("asks for text when the echo option is missing", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(await signer.signedRequest(commandInteraction("echo")), signer.testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			type: 4,
			data: { content: "Give me some text to echo.", flags: 64 },
		});
	});
});
