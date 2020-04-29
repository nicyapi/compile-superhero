const SassCompiler = require('./sasslib/sass.node.js');
import { Uri } from 'vscode';
import * as path from 'path';


export default class SassHelper {

    static style: any = SassCompiler.Sass.style; // nested, expanded, compact, compressed

    static get instance() {
        return new SassHelper();
    }

    static targetCssFormat(format:any) {
        return {
            style: SassCompiler.Sass.style[format],
        }
    }

    compileOne(SassPath: Uri, options:object) {

        return new Promise<any>((resolve, reject) => {
            process.chdir( path.dirname(SassPath.fsPath) );
            let fp = '.' + SassPath.fsPath.replace(path.dirname(SassPath.fsPath), '');
            SassCompiler(fp, options, (result:any) => {
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