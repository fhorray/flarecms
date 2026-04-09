import { expect, test, describe } from "bun:test";
import { transformValue } from "../../../scripts/publish-utils";

describe("Publish Utils: transformValue", () => {
  test("transforms main index path", () => {
    const input = "./src/index.ts";
    const result = transformValue(input);
    expect(result).toBe("./dist/index.js");
  });

  test("transforms main index.tsx path", () => {
    const input = "./src/index.tsx";
    const result = transformValue(input);
    expect(result).toBe("./dist/index.js");
  });

  test("transforms server subpath", () => {
    const input = "./src/server/index.ts";
    const result = transformValue(input);
    expect(result).toBe("./dist/server/index.js");
  });

  test("transforms types in exports", () => {
    const input = {
      types: "./src/index.ts",
      default: "./src/index.ts"
    };
    const result = transformValue(input);
    expect(result.types).toBe("./dist/index.d.ts");
    expect(result.default).toBe("./dist/index.js");
  });

  test("handles bin mapping", () => {
    const input = {
      flarecms: "./src/cli/index.ts"
    };
    const result = transformValue(input);
    expect(result.flarecms).toBe("./dist/cli/index.js");
  });

  test("ignores non-src paths", () => {
    const input = "./scripts/build.ts";
    const result = transformValue(input);
    expect(result).toBe("./scripts/build.ts");
  });

  test("ignores .d.ts files", () => {
    const input = "./src/style.css.d.ts";
    const result = transformValue(input);
    expect(result).toBe("./src/style.css.d.ts");
  });

  test("transforms deeply nested objects", () => {
    const input = {
      exports: {
        ".": {
          types: "./src/index.ts",
          import: "./src/index.ts"
        },
        "./auth": "./src/auth/index.ts"
      }
    };
    const result = transformValue(input);
    expect(result.exports["."].types).toBe("./dist/index.d.ts");
    expect(result.exports["."].import).toBe("./dist/index.js");
    expect(result.exports["./auth"]).toBe("./dist/auth/index.js");
  });

  test("handles arrays in exports", () => {
    const input = ["./src/index.ts", "./src/server/index.ts"];
    const result = transformValue(input);
    expect(result).toEqual(["./dist/index.js", "./dist/server/index.js"]);
  });
});
