"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SassCompiler = require('./sasslib/sass.node.js');
const path = require("path");
class SassHelper {
    static get instance() {
        return new SassHelper();
    }
    static targetCssFormat(format) {
        return {
            style: SassCompiler.Sass.style[format],
        };
    }
    compileOne(SassPath, options) {
        return new Promise((resolve, reject) => {
            process.chdir(path.dirname(SassPath.fsPath));
            let fp = '.' + SassPath.fsPath.replace(path.dirname(SassPath.fsPath), '');
            SassCompiler(fp, options, (result) => {
                if (result.status === 0) {
                    if (!result.text) {
                        result.text = '/* No CSS */';
                    }
                }
                else {
                    result.text = ''; // `/* \n Error: ${result.formatted} \n */`;
                }
                resolve(result);
            });
        });
    }
}
exports.default = SassHelper;
SassHelper.style = SassCompiler.Sass.style; // nested, expanded, compact, compressed
//# sourceMappingURL=index.js.map