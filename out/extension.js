"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const p = require("path");
const child_process_1 = require("child_process");
const { compileSass, sass } = require("./sass/index");
const { src, dest } = require("gulp");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const babel = require("gulp-babel");
const babelEnv = require("@babel/preset-env");
const less = require("gulp-less");
const cssmin = require("gulp-minify-css");
const ts = require("gulp-typescript");
const jade = require("gulp-jade");
const pug = require("pug");
const open = require("open");
const through = require("through2");
const readFileContext = (path) => {
    return fs.readFileSync(path).toString();
};
const fileType = (filename) => {
    const index1 = filename.lastIndexOf(".");
    const index2 = filename.length;
    const type = filename.substring(index1, index2);
    return type;
};
const command = (cmd) => {
    return new Promise((resolve, reject) => {
        child_process_1.exec(cmd, (err, stdout, stderr) => {
            resolve(stdout);
        });
    });
};
const transformPort = (data) => {
    let port = "";
    data.split(/[\n|\r]/).forEach(item => {
        if (item.indexOf("LISTEN") !== -1 && !port) {
            let reg = item.split(/\s+/);
            if (/\d+/.test(reg[1])) {
                port = reg[1];
            }
        }
    });
    return port;
};
const empty = function (code) {
    let stream = through.obj((file, encoding, callback) => {
        //debugger;
        if (!file.isBuffer()) {
            return callback();
        }
        file.contents = Buffer.from(code || "");
        stream.push(file);
        callback();
    });
    return stream;
};
const readFileName = (path, fileContext) => __awaiter(void 0, void 0, void 0, function* () {
    let fileSuffix = fileType(path);
    let config = vscode.workspace.getConfiguration("compile-hero");
    let outputDirectoryPath = {
        ".js": config.get("javascript-output-directory") || "",
        ".scss": config.get("sass-output-directory") || "",
        ".sass": config.get("sass-output-directory") || "",
        ".less": config.get("less-output-directory") || "",
        ".jade": config.get("jade-output-directory") || "",
        ".ts": config.get("typescript-output-directory") || "",
        ".tsx": config.get("typescriptx-output-directory") || "",
        ".pug": config.get("pug-output-directory") || ""
    };
    let compileStatus = {
        ".js": config.get("javascript-output-toggle"),
        ".scss": config.get("sass-output-toggle"),
        ".sass": config.get("sass-output-toggle"),
        ".less": config.get("less-output-toggle"),
        ".jade": config.get("jade-output-toggle"),
        ".ts": config.get("typescript-output-toggle"),
        ".tsx": config.get("typescriptx-output-toggle"),
        ".pug": config.get("pug-output-toggle")
    };
    if (!compileStatus[fileSuffix])
        return;
    let options = {
        "compileErrorMsg": config.get("x-show-compileerror-message"),
        "generateMinifiedHtml": config.get("x-generate-minified-html"),
        "generateHtmlExt": config.get("x-generate-html-ext"),
        "compileFilesInMixinFolders": config.get("x-compile-files-in-mixin-folders"),
        "compileFilesOnSave": config.get("x-compile-files-on-save")
    };
    if (!options.compileFilesOnSave)
        return;
    if (!options.compileFilesInMixinFolders && /[\/\\]mixin(s)*[\/\\]/.test(path)) {
        console.info('ignoring mixin', path);
        return;
    }
    const cbFinished = function () {
        vscode.window.setStatusBarMessage(`Compile-Superhero: successful!`);
    };
    const cbError = function (e) {
        console.error(e);
        vscode.window.setStatusBarMessage(`Compile-Superhero: failed!`);
        if (options.compileErrorMsg)
            vscode.window.showErrorMessage(e.message);
        if (this && this._writableState)
            this._writableState.finalCalled = true; // cancel further piping.
    };
    let outputPath = p.resolve(path, "../", outputDirectoryPath[fileSuffix]);
    vscode.window.setStatusBarMessage(`Compiling ...`);
    switch (fileSuffix) {
        case ".sass":
        case ".scss":
            let done = yield compileSass(fileContext, {
                indentedSyntax: fileSuffix === ".sass" ? 1 : 0,
                style: sass.style.expanded || sass.style.compressed
            });
            if (done.status || done.formatted) {
                cbError(new Error('SASS: ' + path + ': ' + (done.message || done.formatted) + (done.line ? ' (@' + done.line + ':' + done.column + ')' : '')));
                break;
            }
            let text = done.text;
            src(path)
                .pipe(empty(text))
                .pipe(rename({
                extname: ".css"
            }))
                .pipe(dest(outputPath))
                .pipe(cssmin({ compatibility: "ie7" }))
                .on('error', cbError)
                .pipe(rename({
                extname: ".css",
                suffix: ".min"
            }))
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        case ".js":
            if (/.dev.js|.prod.js$/g.test(path)) {
                cbFinished();
                vscode.window.showErrorMessage('The prod or dev file is the allready processed file and will not be compiled: ' + path);
                break;
            }
            src(path)
                .pipe(babel({
                presets: [babelEnv]
            }))
                .on('error', cbError)
                .pipe(rename({ suffix: ".dev" }))
                .pipe(dest(outputPath));
            src(path)
                .pipe(babel({
                presets: [babelEnv]
            }))
                .on('error', cbError)
                .pipe(uglify())
                .on('error', cbError)
                .pipe(rename({ suffix: ".prod" }))
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        case ".less":
            src(path)
                .pipe(less())
                .on('error', cbError)
                .pipe(dest(outputPath))
                .pipe(cssmin({ compatibility: "ie7" }))
                .pipe(rename({ suffix: ".min" }))
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        case ".ts":
            src(path)
                .pipe(ts())
                .on('error', cbError)
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        case ".tsx":
            src(path)
                .pipe(ts({
                jsx: "react"
            }))
                .on('error', cbError)
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        case ".jade":
            if (options.generateMinifiedHtml)
                src(path)
                    .pipe(jade())
                    .on('error', cbError)
                    .pipe(rename({ suffix: ".min", extname: options.generateHtmlExt }))
                    .pipe(dest(outputPath));
            src(path)
                .pipe(jade({
                pretty: true
            }))
                .on('error', cbError)
                .pipe(rename({ extname: options.generateHtmlExt }))
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        case ".pug":
            if (options.generateMinifiedHtml)
                src(path)
                    .pipe(empty(yield new Promise((resolve, reject) => {
                    pug.render(readFileContext(path), {
                        pretty: false
                    }, (err, data) => { if (err) {
                        cbError(err);
                        reject(err);
                    }
                    else
                        resolve(data); });
                })))
                    .on('error', cbError)
                    .pipe(rename({
                    suffix: ".min",
                    extname: options.generateHtmlExt
                }))
                    .pipe(dest(outputPath));
            src(path)
                .pipe(empty(yield new Promise((resolve, reject) => {
                pug.render(readFileContext(path), {
                    pretty: true
                }, (err, data) => { if (err) {
                    cbError(err);
                    reject(err);
                }
                else
                    resolve(data); });
            })))
                .on('error', cbError)
                .pipe(rename({
                extname: options.generateHtmlExt
            }))
                .pipe(dest(outputPath))
                .on('finish', cbFinished);
            break;
        default:
            console.error("Not Found!");
            break;
    }
});
function activate(context) {
    console.log('Extension "compile-superhero" is ready now!');
    vscode.window.setStatusBarMessage(`Compile-Superhero: watching ...`);
    let openInBrowser = vscode.commands.registerCommand("extension.openInBrowser", path => {
        let uri = path.fsPath;
        let platform = process.platform;
        open(uri, {
            app: [
                platform === "win32"
                    ? "chrome"
                    : platform === "darwin"
                        ? "google chrome"
                        : "google-chrome"
            ]
        });
    });
    let closePort = vscode.commands.registerCommand("extension.closePort", () => __awaiter(this, void 0, void 0, function* () {
        let platform = process.platform;
        if (platform !== "win32") { // ---> https://developers.de/blogs/indraneel/archive/2017/10/18/kill-a-process-in-windows-by-port-number.aspx might work
            let inputPort = yield vscode.window.showInputBox({
                placeHolder: "Enter the port you need to close?"
            });
            let info = yield command(`lsof -i :${inputPort}`);
            let port = transformPort(info);
            if (port) {
                yield command(`kill -9 ${port}`);
                vscode.window.setStatusBarMessage("Port closed successfully!");
            }
        }
        else {
            vscode.window.showErrorMessage('SORRY. Does not work on Windows. But on OSX/Linux.');
        }
    }));
    let compileFile = vscode.commands.registerCommand("extension.compileFile", path => {
        let uri = path.fsPath;
        console.log(uri);
        const fileContext = readFileContext(uri);
        readFileName(uri, fileContext);
    });
    let generateLocalDefaultConfig = vscode.commands.registerCommand("extension.generateLocalDefaultConfig", () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        if (vscode.workspace.workspaceFolders) {
            const config = vscode.workspace.getConfiguration('compile-hero');
            for (let x in config) {
                let e = config.inspect(x);
                if (((_a = e) === null || _a === void 0 ? void 0 : _a.defaultValue) === undefined)
                    continue;
                try {
                    yield config.update(x, ((_b = e) === null || _b === void 0 ? void 0 : _b.workspaceValue) !== undefined ? (_c = e) === null || _c === void 0 ? void 0 : _c.workspaceValue : ((_d = e) === null || _d === void 0 ? void 0 : _d.globalValue) !== undefined ? (_e = e) === null || _e === void 0 ? void 0 : _e.globalValue : (_f = e) === null || _f === void 0 ? void 0 : _f.defaultValue, vscode.ConfigurationTarget.Workspace);
                }
                catch (e) {
                    console.error(x, e);
                }
            }
            ;
        }
    }));
    context.subscriptions.push(openInBrowser);
    context.subscriptions.push(closePort);
    context.subscriptions.push(compileFile);
    context.subscriptions.push(generateLocalDefaultConfig);
    vscode.workspace.onDidSaveTextDocument(document => {
        const { fileName } = document;
        const fileContext = readFileContext(fileName);
        readFileName(fileName, fileContext);
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map