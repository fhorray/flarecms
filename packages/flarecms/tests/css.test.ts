import { expect, test, describe } from "bun:test";
import fs from "node:fs";

describe("CSS Modularization", () => {
  test("CSS is built with flare-cms prefix", () => {
    const css = fs.readFileSync("./dist/style.css", "utf8");
    // Verify prefix exists
    expect(css).toContain(".flare-cms");
  });

  test("Global tags are scoped under flare-cms", () => {
    const css = fs.readFileSync("./dist/style.css", "utf8");
    
    // html/body are converted to .flare-cms
    expect(css).toContain(".flare-cms {");
    
    // Verify that utility classes are prefixed with the scope
    // Example: .flare-cms .bg-background
    expect(css).toContain(".flare-cms .bg-background");
  });
});
