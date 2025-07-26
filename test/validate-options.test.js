import { compile, getCompiler } from "./helpers";

describe("validate options", () => {
  const tests = {
    type: {
      success: ["commonjs", "module"],
      failure: [true, false, "foo"],
    },
    exports: {
      success: [
        "Foo",
        "default Foo",
        "named Foo",
        "named Foo FooA",
        "named|Foo FooA",
        "named|Foo|FooA",
        ["named Foo", "named Bar"],
        ["named Foo FooA", "named Bar BarA"],
        ["default Foo", "named Bar BarA"],
        "single Foo",
        "multiple Foo",
        "multiple Foo FooA",
        ["multiple Foo", "multiple Bar"],
        ["multiple Foo FooA", "multiple Bar BarA"],
        { name: "Foo" },
        { syntax: "default", name: "Foo" },
        { syntax: "named", name: "Foo" },
        { syntax: "single", name: "Foo" },
        { syntax: "multiple", name: "Foo" },
        { syntax: "named", name: "Foo", alias: "FooA" },
        { syntax: "multiple", name: "Foo", alias: "FooA" },
        ["Foo", { syntax: "default", name: "Bar" }],
        [
          { syntax: "named", name: "Foo" },
          { syntax: "named", name: "Bar" },
        ],
      ],
      failure: [
        true,
        () => {},
        [1, 2, 3],
        { syntax: "default" },
        { alias: "FooA" },
        { syntax: "foo", name: "Foo" },
        { name: "" },
        { name: "Foo", alias: "" },
      ],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === "object" && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === "success" ? "successfully validate" : "throw an error on"
    } the "${key}" option with "${stringifyValue(value)}" value`, async () => {
      const getOptions = (key, value) => {
        if (key === "type") {
          return { [key]: value, exports: "Foo" };
        }

        if (key === "exports") {
          let isModule = false;

          if (typeof value === "string") {
            isModule = value.includes("default") || value.includes("named");
          } else if (Array.isArray(value)) {
            isModule = value.some((item) =>
              typeof item === "string"
                ? item.includes("default") || item.includes("named")
                : item.syntax
                  ? item.syntax === "default" || item.syntax === "named"
                  : false,
            );
          } else {
            isModule =
              value.syntax &&
              (value.syntax === "default" || value.syntax === "named");
          }

          return { type: isModule ? "module" : "commonjs", [key]: value };
        }

        return { [key]: value };
      };

      const compiler = getCompiler("simple.js", getOptions(key, value));

      let stats;

      try {
        stats = await compile(compiler);
      } finally {
        if (type === "success") {
          expect(stats.hasErrors()).toBe(false);
        } else if (type === "failure") {
          const {
            compilation: { errors },
          } = stats;

          expect(errors).toHaveLength(1);
          expect(() => {
            throw new Error(errors[0].error.message);
          }).toThrowErrorMatchingSnapshot();
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
