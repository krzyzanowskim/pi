import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { parseArgs } from "../src/cli/args.ts";
import { isHeadlessMetadataCommand, validateHeadlessArgs } from "../src/headless.ts";

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

	test("package headless binary assets include themes required during non-interactive startup", () => {
		const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as {
			scripts: Record<string, string>;
		};
		expect(packageJson.scripts["copy-headless-binary-assets"]).toContain(
			"shx rm -rf dist/assets dist/export-html dist/theme",
		);
		expect(packageJson.scripts["copy-headless-binary-assets"]).toContain("dist/theme");
		expect(packageJson.scripts["copy-headless-binary-assets"]).toContain("src/modes/interactive/theme/*.json");
	});

	test("release headless binary assets include themes required during non-interactive startup", () => {
		const script = readFileSync(new URL("../../../scripts/build-binaries.sh", import.meta.url), "utf-8");
		expect(script).toMatch(
			/cp \.\.\/\.\.\/node_modules\/@silvia-odwyer\/photon-node\/photon_rs_bg\.wasm "\$OUTPUT_DIR\/\$platform\/"\n\s*mkdir -p "\$OUTPUT_DIR\/\$platform\/theme"\n\s*cp dist\/modes\/interactive\/theme\/\*\.json "\$OUTPUT_DIR\/\$platform\/theme\/"\n\s*if \[\[ "\$HEADLESS" == "false" \]\]/,
		);
	});
});
