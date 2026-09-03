<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![discussion][discussion]][discussion-url]
[![size][size]][size-url]

# exports-loader

> [!CAUTION]
>
> This loader is deprecated. What it does is a few lines of plugin over webpack's public API — see [Deprecation](#deprecation) for the recipe.

Allows you to set up exports using `module.exports` or `export` for source files.

Useful when a source file does not contain exports or when something is not exported.

For more information on compatibility issues, refer to the [Shimming](https://webpack.js.org/guides/shimming/) guide in the official documentation.

> [!WARNING]
>
> By default, the loader generates exports using ES module syntax.

> [!WARNING]
>
> Be careful: modifying existing exports (`export`, `module.exports`, or `exports`) or adding new exports can lead to errors.

## Deprecation

This loader is deprecated and only receives bug fixes from now on. What it does — appending exports to a file that has none — is a few lines of plugin over webpack's public API, so it does not need a package. Running it prints a warning with the exact code it appends and a link to the example below.

webpack's [add-exports example](https://github.com/webpack/webpack/tree/main/examples/add-exports) is the whole recipe. `NormalModule`'s `processResult` hook hands a plugin what the loaders produced and takes back a replacement:

```js
const { NormalModule } = require("webpack");

class AddExportsPlugin {
  constructor(exports) {
    this.exports = exports;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap("AddExportsPlugin", (compilation) => {
      NormalModule.getCompilationHooks(compilation).processResult.tap(
        "AddExportsPlugin",
        (result, module) => {
          const [source, sourceMap] = result;

          for (const [test, code] of this.exports) {
            if (!module.resource || !test.test(module.resource)) continue;

            // appending moves nothing before it, so the source map still fits;
            // an ast from a loader would be parsed instead of the appended code
            return [`${source}\n${code}`, sourceMap, undefined];
          }

          return result;
        },
      );
    });
  }
}
```

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new AddExportsPlugin([
      [/vendor\.js$/, "module.exports = Foo;"],
      [/math\.js$/, "export { add, PI };"],
    ]),
  ],
};
```

The code to append is the code this loader generates, which its warning prints — `module.exports = Foo;` for `{ type: "commonjs", exports: "single Foo" }`, `export { Foo };` for `{ exports: "Foo" }`, and so on. Two things follow from webpack parsing it itself:

- The exports are the module's own, so they take part in tree shaking, mangling, const inlining and scope hoisting.
- Appending an `export` is what makes a file an ES module, exactly as it would be in the source, so there is no `type` to choose — write the format the file should have.

Inline usage (`exports-loader?exports=Foo!./file.js`) has no counterpart: the plugin matches on the resource, so use a condition on the path instead.

## Getting Started

To begin, you'll need to install `exports-loader`:

```console
npm install exports-loader --save-dev
```

or

```console
yarn add -D exports-loader
```

or

```console
pnpm add -D exports-loader
```

### Inline

The `|` or `%20` (space) allow to separate the `syntax`, `name` and `alias` of export.

The documentation and syntax examples can be read [here](#syntax).

> [!WARNING]
>
> `%20` represents a space in a query string because spaces are not allowed in URLs.

Then add the loader to the desired `import` statement or `require` calls. For example:

```js
import { myFunction } from "exports-loader?exports=myFunction!./file.js";
// Adds the following code to the file's source:
//
// ...
// Code
// ...
//
// export { myFunction }

myFunction("Hello world");
```

```js
import {
  myFunction,
  myVariable,
} from "exports-loader?exports=myVariable,myFunction!./file.js";
// Adds the following code to the file's source:
//
// ...
// Code
// ...
//
// export { myVariable, myFunction };

const newVariable = `${myVariable}!!!`;

console.log(newVariable);

myFunction("Hello world");
```

```js
const {
  myFunction,
} = require("exports-loader?type=commonjs&exports=myFunction!./file.js");
// Adds the following code to the file's source:
//
// ...
// Code
// ...
//
// module.exports = { myFunction }

myFunction("Hello world");
```

```js
// Alternative syntax:
// import myFunction from 'exports-loader?exports=default%20myFunction!./file.js';
import myFunction from "exports-loader?exports=default|myFunction!./file.js";
// `%20` is space in a query string, equivalently `default myFunction`
// Adds the following code to the file's source:
//
// ...
// Code
// ...
//
// exports default myFunction;

myFunction("Hello world");
```

```js
const myFunction = require("exports-loader?type=commonjs&exports=single|myFunction!./file.js");
// `|` is separator in a query string, equivalently `single|myFunction`
// Adds the following code to the file's source:
//
// ...
// Code
// ...
//
// module.exports = myFunction;

myFunction("Hello world");
```

```js
import { myFunctionAlias } from "exports-loader?exports=named|myFunction|myFunctionAlias!./file.js";
// `|` is separator in a query string, equivalently `named|myFunction|myFunctionAlias`
// Adds the following code to the file's source:
//
// ...
// Code
// ...
//
// exports { myFunction as myFunctionAlias };

myFunctionAlias("Hello world");
```

Descriptions of string values can be found in the documentation below.

### Using Configuration

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        // You can use `regexp`
        // test: /vendor\.js/$
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: "myFunction",
        },
      },
    ],
  },
};
```

Finally, run `webpack` using the method you normally use (e.g., via CLI or an npm script).

## Options

|           Name            |                   Type                    |   Default   | Description                 |
| :-----------------------: | :---------------------------------------: | :---------: | :-------------------------- |
|    **[`type`](#type)**    |                `{String}`                 |  `module`   | Format of generated exports |
| **[`exports`](#exports)** | `{String\|Object\|Array<String\|Object>}` | `undefined` | List of exports             |

### `type`

Type: `String`
Default: `module`

Format of generated exports.

Possible values - `commonjs` (CommonJS module syntax) and `module` (ES module syntax).

#### `commonjs`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: "Foo",
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

module.exports = { Foo };
```

#### `module`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "module",
          exports: "Foo",
        },
      },
    ],
  },
};
```

Generate output:

<!-- eslint-skip -->

```js
// ...
// Code
// ...

export { Foo };
```

### `exports`

Type: `String|Array`
Default: `undefined`

List of exports.

#### `String`

Allows to use a string to describe an export.

##### `Syntax`

The `|` or `%20` (space) allow to separate the `syntax`, `name` and `alias` of export.

String syntax - `[[syntax] [name] [alias]]` or `[[syntax]|[name]|[alias]]`, where:

- `[syntax]` (**may be omitted**) -
  - if `type` is `module`- can be `default` and `named`,
  - if `type` is `commonjs`- can be `single` and `multiple`

- `[name]` - name of an exported value (**required**)
- `[alias]` - alias of an exported value (**may be omitted**)

Examples:

- `[Foo]` - generates `export { Foo };`.
- `[default Foo]` - generates `export default Foo;`.
- `[named Foo]` - generates `export { Foo };`.
- `[named Foo FooA]` - generates `export { Foo as FooA };`.
- `[single Foo]` - generates `module.exports = Foo;`.
- `[multiple Foo]` - generates `module.exports = { Foo };`.
- `[multiple Foo FooA]` - generates `module.exports = { 'FooA': Foo };`.
- `[named [name] [name]Alias]` - generates ES module named exports and exports a value equal to the filename under other name., for `single.js` it will be `single` and `singleAlias`, generates `export { single as singleAlias };`.

> [!WARNING]
>
> You need to set `type: "commonjs"` to use `single` or `multiple` syntaxes.

> [!WARNING]
>
> Aliases can't be used together with `default` or `single` syntaxes.

##### Examples

###### ES Module Default Export

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: "default Foo",
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

export default Foo;
```

###### ES Module Named Exports

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: "named Foo FooA",
        },
      },
    ],
  },
};
```

Generate output:

<!-- eslint-skip -->

```js
// ...
// Code
// ...

export { Foo as FooA };
```

###### CommonJS Single Export

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: "single Foo",
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

module.exports = Foo;
```

###### CommonJS Multiple Exports

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: "multiple Foo FooA",
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

module.exports = { FooA: Foo };
```

#### `Object`

Allows to use an object to describe an export.

Properties:

- `syntax` - can be `default` or `named` for the `module` type (`ES modules` module format), and `single` or `multiple` for the `commonjs` type (`CommonJS` module format) (**may be omitted**)
- `name` - name of an exported value (**required**)
- `alias` - alias of an exported value (**may be omitted**)

##### Examples

###### ES Module Default Export

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: {
            syntax: "default",
            name: "Foo",
          },
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

export default Foo;
```

###### ES Module Named Exports

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: {
            syntax: "named",
            name: "Foo",
            alias: "FooA",
          },
        },
      },
    ],
  },
};
```

Generate output:

<!-- eslint-skip -->

```js
// ...
// Code
// ...

export { Foo as FooA };
```

###### CommonJS Single Export

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: {
            syntax: "single",
            name: "Foo",
          },
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

module.exports = Foo;
```

###### CommonJS Multiple Exports

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: {
            syntax: "multiple",
            name: "Foo",
            alias: "FooA",
          },
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

module.exports = { FooA: Foo };
```

#### `Array`

Allow to specify multiple exports. Each item can be a [`string`](https://github.com/webpack/exports-loader#string) or an [`object`](https://github.com/webpack/exports-loader#object).

> [!WARNING]
>
> Not possible to use both `single` and `multiple` syntaxes together due to CommonJS format limitations.

> [!WARNING]
>
> Not possible to use multiple `default` values due to ES module format limitations.

> [!WARNING]
>
> Not possible to use multiple `single` values due to CommonJS format limitations.

##### Examples

###### CommonJS Multiple Exports

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: ["Foo", "multiple Bar", "multiple Baz BazA"],
        },
      },
    ],
  },
};
```

Generate output:

```js
// ...
// Code
// ...

module.exports = { Bar, BazA: Bar, Foo };
```

###### ES Module Default Export And Named Exports Together

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: ["default Foo", "named Bar BarA"],
        },
      },
    ],
  },
};
```

Generate output:

<!-- eslint-skip -->

```js
// ...
// Code
// ...

export default Foo;
export { Bar as BarA };
```

###### Named Exports

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: require.resolve("./path/to/vendor.js"),
        loader: "exports-loader",
        options: {
          exports: [
            { syntax: "named", name: "Foo", alias: "FooA" },
            { syntax: "named", name: "Bar" },
            "Baz",
          ],
        },
      },
    ],
  },
};
```

Generate output:

<!-- eslint-skip -->

```js
// ...
// Code
// ...

export { Foo as FooA, Bar, Baz };
```

## Contributing

We welcome all contributions!

If you're new here, please take a moment to review our contributing guidelines.

[CONTRIBUTING](https://github.com/webpack/exports-loader?tab=contributing-ov-file#contributing)

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/exports-loader.svg
[npm-url]: https://npmjs.com/package/exports-loader
[node]: https://img.shields.io/node/v/exports-loader.svg
[node-url]: https://nodejs.org
[tests]: https://github.com/webpack/exports-loader/workflows/exports-loader/badge.svg
[tests-url]: https://github.com/webpack/exports-loader/actions
[cover]: https://codecov.io/gh/webpack/exports-loader/branch/main/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack/exports-loader
[discussion]: https://img.shields.io/github/discussions/webpack/webpack
[discussion-url]: https://github.com/webpack/webpack/discussions
[size]: https://packagephobia.now.sh/badge?p=exports-loader
[size-url]: https://packagephobia.now.sh/result?p=exports-loader
