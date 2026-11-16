import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../../src/index";
import { commandInteraction, createSigner } from "../helpers/discord";

let signer: Awaited<ReturnType<typeof createSigner>>;

beforeAll(async () => {
	signer = await createSigner();
});

describe("/ping", () => {
	it("replies with Pong!", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(await signer.signedRequest(commandInteraction("ping")), signer.testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 4, data: { content: "Pong!" } });
	});
});
