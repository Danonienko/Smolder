import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../../src/index";
import { commandList, commands } from "../../src/commands";
import { commandInteraction, createSigner } from "../helpers/discord";

let signer: Awaited<ReturnType<typeof createSigner>>;

beforeAll(async () => {
	signer = await createSigner();
});

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
	it("answers an unknown command with an ephemeral message", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(await signer.signedRequest(commandInteraction("nope")), signer.testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			type: 4,
			data: { content: "Unknown command.", flags: 64 },
		});
	});
});
