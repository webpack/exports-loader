import { compile, getCompiler, getErrors, getWarnings } from "./helpers";

describe("deprecation", () => {
  it("should warn and print the code it appends", async () => {
    const compiler = getCompiler("simple.js", { exports: "Foo" });
    const stats = await compile(compiler);
    const [warning] = stats.compilation.warnings;

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    // the loader renders named exports over several lines
    expect(warning.message).toContain("export {");
    expect(warning.message).toContain("Foo");
    expect(warning.message).toContain(
      "https://github.com/webpack/webpack/tree/main/examples/add-exports",
    );
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should print the CommonJs code it appends", async () => {
    const compiler = getCompiler("simple.js", {
      type: "commonjs",
      exports: "single Foo",
    });
    const stats = await compile(compiler);

    expect(stats.compilation.warnings[0].message).toContain(
      "module.exports = Foo;",
    );
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should warn once per rule, not once per module", async () => {
    const compiler = getCompiler("inline.js", {}, { module: { rules: [] } });
    const stats = await compile(compiler);
    const messages = stats.compilation.warnings.map(
      (warning) => warning.message,
    );

    expect(messages.length).toBeGreaterThan(0);
    expect(new Set(messages).size).toBe(messages.length);
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
