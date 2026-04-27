import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const envMock: Record<string, string | undefined> = {};

vi.mock("$env/dynamic/private", () => ({
	get env() {
		return envMock;
	}
}));

beforeEach(() => {
	for (const key of Object.keys(envMock)) delete envMock[key];
});

afterEach(() => {
	vi.resetModules();
});

describe("blizzardTokenCache", () => {
	it("throws a configuration error when Blizzard credentials are missing", async () => {
		vi.resetModules();
		envMock.BLIZZARD_CLIENT_ID = "";
		envMock.BLIZZARD_CLIENT_SECRET = "";
		const mod = await import("../blizzardTokenCache");
		await expect(mod.getOrRefreshBlizzardAccessToken()).rejects.toThrow(/Blizzard.*Client ID/);
	});
});

describe("tokenCache (Warcraft Logs)", () => {
	it("throws a configuration error when WCL credentials are missing", async () => {
		vi.resetModules();
		envMock.WCL_CLIENT_ID = "";
		envMock.WCL_CLIENT_SECRET = "";
		const mod = await import("../tokenCache");
		await expect(mod.getOrRefreshAccessToken()).rejects.toThrow(/WCL.*Client ID/);
	});
});
