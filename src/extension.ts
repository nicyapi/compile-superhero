import * as vscode from "vscode";
import * as fs from "fs";
import * as p from "path";
import { exec } from "child_process";
import { Pipe, Stream } from "stream";
import { resolve } from "dns";
import { debug } from "util";
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

import * as configscreen from "./lib/configscreen";

const readFileContext = (path: string): string => {
  return fs.readFileSync(path).toString();
};
const fileType = (filename: string) => {
  const index1 = filename.lastIndexOf(".");
  const index2 = filename.length;
  const type = filename.substring(index1, index2);
  return type;
};
const command = (cmd: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      resolve(stdout);
    });
  });
};
const transformPort = (data: string): string => {
  let port: string = "";
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
const empty = function(code: string) {
  let stream = through.obj((file: any, encoding: any, callback: any) => {
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

const readFileName = async (path: string, fileContext: string) => {
  let fileSuffix = fileType(path);
  let config = vscode.workspace.getConfiguration("compile-hero");
  let outputDirectoryPath: any = {
    ".js": config.get<string>("javascript-output-directory") || "",
    ".scss": config.get<string>("sass-output-directory") || "",
    ".sass": config.get<string>("sass-output-directory") || "",
    ".less": config.get<string>("less-output-directory") || "",
    ".jade": config.get<string>("jade-output-directory") || "",
    ".ts": config.get<string>("typescript-output-directory") || "",
    ".tsx": config.get<string>("typescriptx-output-directory") || "",
    ".pug": config.get<string>("pug-output-directory") || ""
  };
  let compileStatus: any = {
    ".js": config.get<boolean>("javascript-output-toggle"),
    ".scss": config.get<boolean>("sass-output-toggle"),
    ".sass": config.get<boolean>("sass-output-toggle"),
    ".less": config.get<boolean>("less-output-toggle"),
    ".jade": config.get<boolean>("jade-output-toggle"),
    ".ts": config.get<boolean>("typescript-output-toggle"),
    ".tsx": config.get<boolean>("typescriptx-output-toggle"),
    ".pug": config.get<boolean>("pug-output-toggle")
  };
  if (!compileStatus[fileSuffix]) return;

  let options: any = {
    "compileErrorMsg": config.get<boolean>("x-show-compile-error-messages"),
    "generateMinifiedHtml": config.get<boolean>("x-generate-minified-html"),
    "generateHtmlExt": config.get<boolean>("x-generate-html-ext"),
    "compileFilesInMixinFolders": config.get<boolean>("x-compile-files-in-mixin-folders"),
    "compileFilesOnSave": config.get<boolean>("x-compile-files-on-save")
  }
  if (!options.compileFilesOnSave) return;
  if (!options.compileFilesInMixinFolders && /[\/\\]mixin(s)*[\/\\]/.test(path)) { console.info('ignoring mixin', path);  return; }

  const cbFinished = function() {
    vscode.window.setStatusBarMessage(`Compile-Superhero: successful!`);
  };
  const cbError = function(this: any, e: Error) {
    console.error(e);
    vscode.window.setStatusBarMessage(`Compile-Superhero: failed!`);
    if (options.compileErrorMsg)
      vscode.window.showErrorMessage(e.message);
  
    if (this && this._writableState) this._writableState.finalCalled = true; // cancel further piping.
  };
  
  let outputPath = p.resolve(path, "../", outputDirectoryPath[fileSuffix]);

  vscode.window.setStatusBarMessage(`Compiling ...`);

  switch (fileSuffix) {

    case ".sass":
    case ".scss":
      let done = await compileSass(fileContext, {
        indentedSyntax: fileSuffix === ".sass" ? 1 : 0,
        style: sass.style.expanded || sass.style.compressed
      });

      if (done.status || done.formatted) {
        cbError(new Error('SASS: ' + path + ': ' + (done.message || done.formatted) + (done.line ? ' (@' + done.line + ':' + done.column + ')' : '') ));
        break;
      }
      let text = done.text;
      src(path)
        .pipe(empty(text))
        .pipe(
          rename({
            extname: ".css"
          })
        )
        .pipe(dest(outputPath))
        .pipe(cssmin({ compatibility: "ie7" }))
        .on('error', cbError)
        .pipe(
          rename({
            extname: ".css",
            suffix: ".min"
          })
        )
        .pipe(dest(outputPath))
        .on('finish', cbFinished);
      break;

    case ".js":
      if (/.dev.js|.prod.js$/g.test(path)) {
        cbFinished();
        vscode.window.showErrorMessage(
          'The prod or dev file is the allready processed file and will not be compiled: ' + path
        );
        break;
      }
      src(path)
        .pipe(
          babel({
            presets: [babelEnv]
          })
        )
        .on('error', cbError)
        .pipe(rename({ suffix: ".dev" }))
        .pipe(dest(outputPath));

      src(path)
        .pipe(
          babel({
            presets: [babelEnv]
          })
        )
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
        .pipe(
          ts({
            jsx: "react"
          })
        )
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
        .pipe(
          jade({
            pretty: true
          })
        )
        .on('error', cbError)
        .pipe(rename({ extname: options.generateHtmlExt }))
        .pipe(dest(outputPath))
        .on('finish', cbFinished);
      break;

    case ".pug":
      if (options.generateMinifiedHtml)
        src(path)
          .pipe(
            empty(
              await new Promise<string>((resolve, reject) => {
                pug.render(readFileContext(path), {
                  pretty: false
                }, (err: any, data: string) => { if (err) {cbError(err); reject(err);} else resolve(data); } )
              })
            )
          )
          .on('error', cbError)
          .pipe(
            rename({
              suffix: ".min",
              extname: options.generateHtmlExt
            })
          )
          .pipe(dest(outputPath));

      src(path)
        .pipe(
          empty(
            await new Promise<string>((resolve, reject) => {
              pug.render(readFileContext(path), {
                pretty: true
              }, (err: any, data: string) => { if (err) {cbError(err); reject(err);} else resolve(data); } )
            })
          )
        )
        .on('error', cbError)
        .pipe(
          rename({
            extname: options.generateHtmlExt
          })
        )
        .pipe(dest(outputPath))
        .on('finish', cbFinished);
      break;

    default:
      console.error("Not Found!");
      break;
  }
};
export function activate(context: vscode.ExtensionContext) {
  configscreen.activate(context);

  console.log('Extension "compile-superhero" is ready now!');
  vscode.window.setStatusBarMessage(`Compile-Superhero: watching ...`);
  let openInBrowser = vscode.commands.registerCommand(
    "extension.openInBrowser",
    path => {
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
    }
  );
  let closePort = vscode.commands.registerCommand(
    "extension.closePort",
    async () => {
      let platform = process.platform;

      if (platform !== "win32") {    // ---> https://developers.de/blogs/indraneel/archive/2017/10/18/kill-a-process-in-windows-by-port-number.aspx might work

        let inputPort = await vscode.window.showInputBox({
          placeHolder: "Enter the port you need to close?"
        });
        let info = await command(`lsof -i :${inputPort}`);
        let port = transformPort(info);
        if (port) {
          await command(`kill -9 ${port}`);
          vscode.window.setStatusBarMessage("Port closed successfully!");
        }
      }
      else {
        vscode.window.showErrorMessage('SORRY. Does not work on Windows. But on OSX/Linux.');
      }
    }
  );
  let compileFile = vscode.commands.registerCommand(
    "extension.compileFile",
    path => {
      let uri = path.fsPath;
      console.log(uri);
      const fileContext: string = readFileContext(uri);
      readFileName(uri, fileContext);
    }
  );
  let generateLocalDefaultConfig = vscode.commands.registerCommand(
    "extension.generateLocalDefaultConfig",
    async () => {
      if (vscode.workspace.workspaceFolders) {
        const config = vscode.workspace.getConfiguration('compile-hero');

        for (let x in config) {
          let e = config.inspect(x);
          if (e?.defaultValue === undefined) continue;
          
          try {
            await config.update(x, e?.workspaceValue !== undefined ? e?.workspaceValue : e?.globalValue !== undefined ? e?.globalValue : e?.defaultValue, vscode.ConfigurationTarget.Workspace);
          }
          catch(e) {
            console.error(x, e);
          }

        };
      }

    }

  );

  context.subscriptions.push(openInBrowser);
  context.subscriptions.push(closePort);
  context.subscriptions.push(compileFile);
  context.subscriptions.push(generateLocalDefaultConfig);
  vscode.workspace.onDidSaveTextDocument(document => {
    const { fileName } = document;
    const fileContext: string = readFileContext(fileName);
    readFileName(fileName, fileContext);
  });
}
export function deactivate() {}
