import { compile, getCompiler, getErrors, getWarnings } from "./helpers";

// the loader warns only where the "exports" parser option exists, so the
// version the compiler reports is what decides it
function setWebpackVersion(compiler, version) {
  compiler.webpack = Object.create(compiler.webpack, {
    version: { value: version },
  });

  return compiler;
}

describe("deprecation", () => {
  it("should not warn when webpack does not add exports itself", async () => {
    const compiler = setWebpackVersion(
      getCompiler("simple.js", { exports: "Foo" }),
      "5.110.1",
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toEqual([]);
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should warn when webpack adds exports itself", async () => {
    const compiler = setWebpackVersion(
      getCompiler("simple.js", { exports: "Foo" }),
      "5.111.0",
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(stats.compilation.warnings[0].message).toContain(
      'parser: { exports: "Foo" }',
    );
    expect(stats.compilation.warnings[0].message).toContain(
      'type: "javascript/esm"',
    );
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should print the replacement for the module's own value", async () => {
    const compiler = setWebpackVersion(
      getCompiler("simple.js", {
        type: "commonjs",
        exports: ["single Foo"],
      }),
      "6.0.0",
    );
    const stats = await compile(compiler);

    expect(stats.compilation.warnings[0].message).toContain(
      'parser: { exports: {"default":"Foo"} }',
    );
    // a script needs no type, its CommonJs exports are the default
    expect(stats.compilation.warnings[0].message).not.toContain(
      'type: "javascript/esm"',
    );
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should print a bare name as a shorthand", async () => {
    const compiler = setWebpackVersion(
      getCompiler("simple.js", { type: "commonjs", exports: "Foo" }),
      "5.111.0",
    );
    const stats = await compile(compiler);

    expect(stats.compilation.warnings[0].message).toContain(
      'parser: { exports: "Foo" }',
    );
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should print the replacement for multiple exports", async () => {
    const compiler = setWebpackVersion(
      getCompiler("simple.js", {
        exports: ["named Foo", "named Bar BarA"],
      }),
      "5.112.0",
    );
    const stats = await compile(compiler);

    expect(stats.compilation.warnings[0].message).toContain(
      'parser: { exports: {"Foo":"Foo","BarA":"Bar"} }',
    );
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should warn once per rule, not once per module", async () => {
    const compiler = setWebpackVersion(
      getCompiler("inline.js", {}, { module: { rules: [] } }),
      "5.111.0",
    );
    const stats = await compile(compiler);
    const messages = stats.compilation.warnings.map(
      (warning) => warning.message,
    );

    expect(messages.length).toBeGreaterThan(0);
    expect(new Set(messages).size).toBe(messages.length);
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
