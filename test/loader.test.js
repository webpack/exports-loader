import path from "node:path";

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers";

describe("loader", () => {
  it("should work with string value", async () => {
    const compiler = getCompiler("simple.js", {
      exports: "Foo",
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it("should work with object value", async () => {
    const compiler = getCompiler("simple.js", {
      exports: { name: "Foo" },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it("should work with object value (syntax, name and alias)", async () => {
    const compiler = getCompiler("simple.js", {
      exports: {
        syntax: "named",
        name: "Foo",
        alias: "FooA",
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it('should work with object value with "default" syntax', async () => {
    const compiler = getCompiler("simple.js", {
      exports: {
        syntax: "default",
        name: "Foo",
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it("should work with multiple string values", async () => {
    const compiler = getCompiler("simple.js", {
      exports: ["Foo", "Bar"],
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it("should work with multiple object and string values", async () => {
    const compiler = getCompiler("simple.js", {
      exports: [
        "Foo",
        { syntax: "default", name: "Bar" },
        { syntax: "named", name: "Baz", alias: "BarA" },
      ],
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it("should work with inline syntax", async () => {
    const compiler = getCompiler("inline.js", {}, { module: undefined });
    const stats = await compile(compiler);

    expect(getModuleSource("./inline.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it('should work with source maps when the "devtool" option is enabled', async () => {
    const compiler = getCompiler(
      "simple.js",
      {},
      {
        devtool: "source-map",
        module: {
          rules: [
            {
              test: /\.js$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { exports: "Foo" },
                },
                {
                  loader: "babel-loader",
                },
              ],
            },
          ],
        },
      },
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  it('should not work with source maps when the "devtool" options are disabled', async () => {
    const compiler = getCompiler(
      "simple.js",
      {},
      {
        devtool: false,
        module: {
          rules: [
            {
              test: /\.js$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { exports: "Foo" },
                },
                {
                  loader: "babel-loader",
                },
              ],
            },
          ],
        },
      },
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getErrors(stats)).toMatchSnapshot("errors");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
  });

  function createSuccessCase(type, exports) {
    it(`should work with the "${type}" module format for ${JSON.stringify(
      exports,
    )} export list`, async () => {
      const compiler = getCompiler("simple.js", { type, exports });
      const stats = await compile(compiler);

      expect(getModuleSource("./simple.js", stats)).toMatchSnapshot("module");
      expect(
        execute(readAsset("main.bundle.js", compiler, stats)),
      ).toMatchSnapshot("result");
      expect(getErrors(stats)).toMatchSnapshot("errors");
      expect(getWarnings(stats)).toMatchSnapshot("warnings");
    });
  }

  function createFailedCase(type, exports) {
    it(`should work with the "${type}" module format for ${JSON.stringify(
      exports,
    )} export list`, async () => {
      const compiler = getCompiler("simple.js", { type, exports });
      const stats = await compile(compiler);

      expect(getErrors(stats)).toMatchSnapshot("errors");
      expect(getWarnings(stats)).toMatchSnapshot("warnings");
    });
  }
  //
  createSuccessCase("commonjs", "Foo");
  createSuccessCase("commonjs", "   Foo   ");
  createFailedCase("commonjs", "default");
  createFailedCase("commonjs", "default Foo");
  createFailedCase("commonjs", { syntax: "default", name: "Foo" });
  createFailedCase("commonjs", "named Foo");
  createSuccessCase("commonjs", "single Foo");
  createSuccessCase("commonjs", "single single");
  createFailedCase("commonjs", "single Foo FooA");
  createFailedCase("commonjs", {
    syntax: "single",
    name: "Foo",
    alias: "FooA",
  });
  createSuccessCase("commonjs", "multiple Foo");
  createSuccessCase("commonjs", "multiple Foo FooA");
  createSuccessCase("commonjs", "multiple Foo Foo-Bar");
  createSuccessCase("commonjs", "multiple|Foo");
  createSuccessCase("commonjs", "multiple|Foo|FooA");
  createSuccessCase("commonjs", ["Foo", "Bar"]);
  createSuccessCase("commonjs", ["multiple Foo", "multiple Bar"]);
  createSuccessCase("commonjs", ["multiple Foo FooA", "multiple Bar BarA"]);
  createSuccessCase("commonjs", [
    "multiple myVariable.myFunction myFunction",
    "multiple Bar BarA",
  ]);
  createFailedCase("commonjs", "multiple   Foo");
  createFailedCase("commonjs", "multiple Foo FooA FooB");
  createFailedCase("commonjs", ["single Foo", "single Bar"]);
  createFailedCase("commonjs", ["multiple Foo", "multiple Foo"]);
  createFailedCase("commonjs", ["multiple Foo", "multiple Bar Foo"]);
  createFailedCase("commonjs", ["multiple Foo Bar", "multiple Bar"]);
  createFailedCase("commonjs", ["multiple Foo Baz", "multiple Bar Baz"]);
  createFailedCase("commonjs", [
    "multiple myVariable.myFunction",
    "multiple Bar myVariable.myFunction",
  ]);
  createFailedCase("commonjs", [
    "multiple myVariable.myFunction foo.bar",
    "multiple Bar foo.bar",
  ]);
  createFailedCase("commonjs", "unknown Foo");
  createFailedCase("commonjs", { syntax: "unknown", name: "Foo" });
  createFailedCase("commonjs", "`invalid`");
  createFailedCase("commonjs", " ");
  createFailedCase("commonjs", "  ");
  createFailedCase("commonjs", "   ");
  createFailedCase("commonjs", "    ");

  createSuccessCase("module", "Foo");
  createSuccessCase("module", "   Foo   ");
  createFailedCase("module", "default");
  createFailedCase("module", "single Foo");
  createFailedCase("module", { syntax: "single", name: "Foo" });
  createFailedCase("module", "multiple Foo");
  createSuccessCase("module", "default Foo");
  createFailedCase("module", "default default");
  createFailedCase("module", "default Foo FooA");
  createFailedCase("module", {
    syntax: "single",
    name: "Foo",
    alias: "FooA",
  });
  createSuccessCase("module", "named Foo");
  createSuccessCase("module", "named Foo FooA");
  createSuccessCase("module", "named|Foo");
  createSuccessCase("module", "named|Foo|FooA");
  createSuccessCase("module", ["Foo", "Bar"]);
  createSuccessCase("module", ["named Foo", "named Bar"]);
  createSuccessCase("module", ["named Foo FooA", "named Bar BarA"]);
  createSuccessCase("module", ["named Foo default", "named Bar BarA"]);
  createSuccessCase("module", ["default Foo", "named Bar"]);
  createSuccessCase("module", ["default Foo", "named Bar BarA"]);
  createSuccessCase("module", ["default Foo", "named Bar BarA", "named Baz"]);
  createFailedCase("module", "named Foo FooA FooB");
  createFailedCase("module", ["default Foo", "default Bar"]);
  createFailedCase("module", ["named Foo", "named Foo"]);
  createFailedCase("module", ["named Foo", "named Bar Foo"]);
  createFailedCase("module", ["named Foo Bar", "named Bar"]);
  createFailedCase("module", ["named Foo Baz", "named Bar Baz"]);
  createFailedCase("module", "unknown Foo");
  createFailedCase("module", { syntax: "unknown", name: "Foo" });
  createFailedCase("module", "`invalid`");
  createFailedCase("module", " ");
  createFailedCase("module", "  ");
  createFailedCase("module", "   ");
  createFailedCase("module", "    ");
});
