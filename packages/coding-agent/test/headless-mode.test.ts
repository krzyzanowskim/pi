import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { parseArgs } from "../src/cli/args.ts";
import { isHeadlessMetadataCommand, isHeadlessRuntime, validateHeadlessArgs } from "../src/headless.ts";

interface PackageJsonScripts {
	scripts: Record<string, string>;
}

describe("validateHeadlessArgs", () => {
	for (const args of [
		["-p", "hello"],
		["--print", "hello"],
		["--mode", "json", "hello"],
		["--mode", "rpc"],
	]) {
		test(`accepts explicit headless mode: ${args.join(" ")}`, () => {
			expect(validateHeadlessArgs(args)).toEqual({ ok: true });
		});
	}

	for (const args of [["--help"], ["--version"], ["--list-models"], ["--list-models", "sonnet"]]) {
		test(`accepts metadata command: ${args.join(" ")}`, () => {
			expect(validateHeadlessArgs(args)).toEqual({ ok: true });
		});
	}

	for (const args of [["--help"], ["--list-models"], ["--list-models", "sonnet"]]) {
		test(`allows metadata command through interactive TTY guard: ${args.join(" ")}`, () => {
			expect(isHeadlessMetadataCommand(parseArgs(args))).toBe(true);
		});
	}

	for (const args of [["--version"], ["-p", "hello"], ["--mode", "json", "hello"], ["--mode", "rpc"]]) {
		test(`does not classify runtime command as metadata: ${args.join(" ")}`, () => {
			expect(isHeadlessMetadataCommand(parseArgs(args))).toBe(false);
		});
	}

	for (const args of [[], ["hello"], ["--resume", "hello"], ["--mode", "text", "hello"]]) {
		test(`rejects interactive invocation: ${args.join(" ") || "<empty>"}`, () => {
			expect(validateHeadlessArgs(args)).toEqual({
				ok: false,
				message: "Headless binary does not support interactive mode. Use -p, --mode json, or --mode rpc.",
			});
		});
	}
});

describe("isHeadlessRuntime", () => {
	test("accepts explicit headless environment values", () => {
		const original = process.env.PI_HEADLESS;
		try {
			process.env.PI_HEADLESS = "1";
			expect(isHeadlessRuntime()).toBe(true);
			process.env.PI_HEADLESS = "true";
			expect(isHeadlessRuntime()).toBe(true);
			process.env.PI_HEADLESS = "TRUE";
			expect(isHeadlessRuntime()).toBe(true);
			process.env.PI_HEADLESS = "0";
			expect(isHeadlessRuntime()).toBe(false);
		} finally {
			if (original === undefined) {
				delete process.env.PI_HEADLESS;
			} else {
				process.env.PI_HEADLESS = original;
			}
		}
	});
});

describe("headless binary assets", () => {
	test("package headless binary asset copy removes interactive-only dist assets", () => {
		const packageJson = JSON.parse(
			readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
		) as PackageJsonScripts;
		const script = packageJson.scripts["copy-headless-binary-assets"];

		expect(script).toContain("dist/modes/interactive/assets");
		expect(script).toContain("dist/modes/interactive/theme");
		expect(script).toContain("dist/core/export-html");
		expect(script).not.toContain("src/modes/interactive/theme/*.json");
	});

	test("release headless binary archives skip interactive-only files", () => {
		const script = readFileSync(new URL("../../../scripts/build-binaries.sh", import.meta.url), "utf-8");

		expect(script).toContain('if [[ "$HEADLESS" == "true" ]]; then\n        continue\n    fi');
		expect(script).toContain('ARCHIVE_PREFIX="pi-headless"');
		expect(script).toContain('ENTRYPOINT="./dist/bun/headless-cli.js"');
	});
});
