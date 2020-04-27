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
const path = require("path");
const vscode = require("vscode");
const pug = require("pug");
const less = require("less");
const fsO = require("fs");
const fs = fsO.promises;
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('configScreen.start', () => {
        SuperheroConfigPanel.createOrShow(context.extensionPath);
    }));
    /* Example
    context.subscriptions.push(
        vscode.commands.registerCommand('configScreen.doRefactor', () => {
            if (SuperheroConfigPanel.currentPanel) {
                SuperheroConfigPanel.currentPanel.doRefactor();
            }
        })
    );
    */
    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(SuperheroConfigPanel.viewType, {
            deserializeWebviewPanel(webviewPanel, state) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log(`Got state: ${state}`);
                    SuperheroConfigPanel.revive(webviewPanel, context.extensionPath);
                });
            }
        });
    }
}
exports.activate = activate;
/**
 * Manages cat coding webview panels
 */
class SuperheroConfigPanel {
    constructor(panel, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionPath = extensionPath;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'usersettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:bananaacid.compile-superhero');
                    return;
                case 'unset':
                    //DEBUG: vscode.window.showInformationMessage('unset: ' + message.key);
                    vscode.workspace.getConfiguration('compile-hero')
                        .update(message.key.replace('compile-hero.', ''), undefined, vscode.ConfigurationTarget.Workspace);
                    return;
                case 'change':
                    //DEBUG: vscode.window.showInformationMessage('change: ' + message.key + ' -> ' + JSON.stringify(message.value));
                    vscode.workspace.getConfiguration('compile-hero')
                        .update(message.key.replace('compile-hero.', ''), message.value, vscode.ConfigurationTarget.Workspace);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionPath) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (SuperheroConfigPanel.currentPanel) {
            SuperheroConfigPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(SuperheroConfigPanel.viewType, 'Compile-Superhero Configuration', column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `configscreen` directory.
            localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'out/configscreen'))]
        });
        SuperheroConfigPanel.currentPanel = new SuperheroConfigPanel(panel, extensionPath);
    }
    static revive(panel, extensionPath) {
        SuperheroConfigPanel.currentPanel = new SuperheroConfigPanel(panel, extensionPath);
    }
    /* Example
    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    */
    dispose() {
        SuperheroConfigPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = this._panel.webview;
            //this._panel.title = "new title";
            this._panel.webview.html = yield this._getHtmlForWebview(webview);
        });
    }
    _getHtmlForWebview(webview) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use a nonce to whitelist which scripts can be run
            const nonce = this.getNonce();
            // Local path to main script run in the webview
            const extPathScript = vscode.Uri.file(path.join(this._extensionPath, 'out/configscreen', 'index.js'));
            // And the uri we use to load this script in the webview
            const scriptUri = webview.asWebviewUri(extPathScript).toString();
            // the markup of our view
            const extPathViewMain = vscode.Uri.file(path.join(this._extensionPath, 'out/configscreen', 'index.pug'));
            // the css for our view
            const extPathLessMain = vscode.Uri.file(path.join(this._extensionPath, 'out/configscreen', 'index.less'));
            const lessMain = yield less.render(yield fs.readFile(extPathLessMain.fsPath, { encoding: 'utf8' }), {
                filename: extPathLessMain.fsPath
            }).catch(err => console.log(err));
            const extPathHeroLogo = vscode.Uri.file(path.join(this._extensionPath, 'logos', 'hero2.png'));
            const heroUri = webview.asWebviewUri(extPathHeroLogo).toString();
            const extPathPackageJson = vscode.Uri.file(path.join(this._extensionPath, './', 'package.json'));
            let json = yield Promise.resolve().then(() => require(extPathPackageJson.fsPath));
            let settingsObject = json.contributes.configuration.properties;
            const extPathDetailsJson = vscode.Uri.file(path.join(this._extensionPath, './out/configscreen', 'details.json'));
            let detailsJson = yield Promise.resolve().then(() => require(extPathDetailsJson.fsPath));
            let config = vscode.workspace.getConfiguration('compile-hero');
            let settings = {};
            for (let i in settingsObject) {
                if (i === undefined)
                    continue;
                //console.info('i', i);
                let [_, second] = i.split('.');
                let [first, ...rest] = second.split('-');
                let category = settingsObject[i].csgroup; // first !== 'x' ? 'default' : 'advanced';   // filter specifics
                if (!settings[category])
                    settings[category] = {};
                if (!settings[category][first])
                    settings[category][first] = {};
                settings[category][first][i] = Object.assign({ key: i, caption: rest.join(' ').replace(/\b[a-z]/g, match => match.toUpperCase()), current: config.get(second), values: config.inspect(second) }, settingsObject[i]);
            }
            let html = yield new Promise((resolve, reject) => {
                pug.renderFile(extPathViewMain.fsPath, {
                    webview,
                    nonce,
                    scriptUri,
                    settings,
                    lessMain,
                    detailsJson,
                    heroUri
                }, (err, data) => {
                    var _a;
                    if (err) {
                        (_a = vscode.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(err.message);
                        vscode.window.showErrorMessage(err.message);
                        reject(err);
                    }
                    else
                        resolve(data);
                });
            });
            return html;
        });
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
SuperheroConfigPanel.viewType = 'configScreen';
//# sourceMappingURL=configscreen.js.map