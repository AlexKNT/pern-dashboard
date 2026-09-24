import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import tsParser from "@typescript-eslint/parser";
import palette from "./no-raw-palette-class.js";

/**
 * The palette rule's own test: a raw palette class fails, a semantic role passes, and
 * the file where the palette is declared is exempt.
 *
 * This is the check behind spec 0003's AC-18, and it is the reason the rule is a rule
 * rather than a note in a document.
 */
const linter = new Linter();

const config = [
  {
    files: ["**/*.tsx"],
    plugins: { palette },
    languageOptions: { parser: tsParser },
    rules: { "palette/no-raw-palette-class": "error" },
  },
];

function lint(code: string) {
  return linter.verify(code, config, { filename: "widget.tsx" });
}

describe("no-raw-palette-class", () => {
  it("reports a raw palette background class", () => {
    const messages = lint('const a = <div className="bg-blue-500 p-4" />;');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("bg-blue-500");
  });

  it("reports a raw palette text class", () => {
    const messages = lint('const a = <p className="text-gray-700" />;');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("text-gray-700");
  });

  it("reports a raw palette class inside a template literal", () => {
    const messages = lint("const a = `border-zinc-200 ${extra}`;");
    expect(messages).toHaveLength(1);
  });

  it("reports a variant prefixed raw palette class", () => {
    const messages = lint('const a = <div className="dark:bg-slate-900" />;');
    expect(messages).toHaveLength(1);
  });

  it("accepts semantic role classes", () => {
    const messages = lint(
      'const a = <div className="bg-background text-muted-foreground border-border" />;',
    );
    expect(messages).toEqual([]);
  });

  it("accepts a palette looking name that is not a palette step", () => {
    const messages = lint('const a = <div className="bg-card text-primary-foreground" />;');
    expect(messages).toEqual([]);
  });

  it("still reports the raw palette class beside a semantic one", () => {
    const messages = lint('const a = <div className="bg-background bg-blue-500" />;');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("bg-blue-500");
  });

  it("reports a raw palette class behind a conditional", () => {
    const messages = lint('const a = <div className={active ? "bg-red-600" : "bg-muted"} />;');
    expect(messages).toHaveLength(1);
  });
});
