/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import { SourceMapConsumer, SourceNode } from "source-map";

import schema from "./options.json";
import { getExports, renderExports, warnDeprecation } from "./utils";

const FOOTER = "/*** EXPORTS FROM exports-loader ***/\n";

export default function loader(content, sourceMap) {
  const options = this.getOptions(schema);
  const type = options.type || "module";
  const callback = this.async();

  let exports;

  try {
    exports = getExports(type, options.exports);
  } catch (error) {
    callback(error);

    return;
  }

  warnDeprecation(this, exports);

  const exportsCode = renderExports(this, type, exports);

  if (this.sourceMap && sourceMap) {
    const node = SourceNode.fromStringWithSourceMap(
      content,
      new SourceMapConsumer(sourceMap),
    );

    node.add(`\n${FOOTER}${exportsCode}`);

    const result = node.toStringWithSourceMap({ file: this.resourcePath });

    callback(null, result.code, result.map.toJSON());

    return;
  }

  callback(null, `${content}\n${FOOTER}${exportsCode}`, sourceMap);
}
