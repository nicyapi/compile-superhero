import * as path from 'path';
import * as vscode from 'vscode';
import * as pug from 'pug';
import * as less from 'less';
import * as fsO from 'fs';
const fs = fsO.promises;

// 'package.json'.contributes.configuration.properties
type cmdIn = {
    type: string,
    default: any,
    description: string,
    csgroup: string,
}
type SettingsItemsIn = { [key: string]: cmdIn }

type cmdOutValues = {
    key: string,
    defaultValue?: any,
    globalValue?: any,
    workspaceFolderValue?: any,
    workspaceValue?: any,
}
type cmdOut = {
    key: string,
    caption: string,
    type: string,
    default: any,
    values?: cmdOutValues, // inspect()
    current: any,
    description: string
};
type SettingsItems = { [key: string]: { [key: string]: { [key: string]: cmdOut } } };


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('configScreen.start', () => {
            SuperheroConfigPanel.createOrShow(context.extensionPath);
        })
    );

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
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`Got state: ${state}`);
                SuperheroConfigPanel.revive(webviewPanel, context.extensionPath);
            }
        });
    }
}

/**
 * Manages cat coding webview panels
 */
class SuperheroConfigPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
    public static currentPanel: SuperheroConfigPanel | undefined;

    public static readonly viewType = 'configScreen';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionPath: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (SuperheroConfigPanel.currentPanel) {
            SuperheroConfigPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            SuperheroConfigPanel.viewType,
            'Compile-Superhero Configuration',
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `configscreen` directory.
                localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'out/configscreen'))]
            }
        );

        SuperheroConfigPanel.currentPanel = new SuperheroConfigPanel(panel, extensionPath);
    }

    public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
        SuperheroConfigPanel.currentPanel = new SuperheroConfigPanel(panel, extensionPath);
    }

    private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
        this._panel = panel;
        this._extensionPath = extensionPath;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
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
            },
            null,
            this._disposables
        );
    }

    /* Example
    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    */

    public dispose() {
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

    private async _update() {
        const webview = this._panel.webview;
        
        //this._panel.title = "new title";
        this._panel.webview.html = await this._getHtmlForWebview(webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        // Use a nonce to whitelist which scripts can be run
        const nonce = this.getNonce();

        
        // Local path to main script run in the webview
        const extPathScript = vscode.Uri.file(
            path.join(this._extensionPath, 'out/configscreen', 'index.js')
        );
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(extPathScript).toString();
        

        // the markup of our view
        const extPathViewMain = vscode.Uri.file(
            path.join(this._extensionPath, 'out/configscreen', 'index.pug')
        ); 
        // the css for our view
        const extPathLessMain = vscode.Uri.file(
            path.join(this._extensionPath, 'out/configscreen', 'index.less')
        );
        const lessMain = await less.render(await fs.readFile(extPathLessMain.fsPath, { encoding: 'utf8' }), {
            filename: extPathLessMain.fsPath
        }).catch(err => console.log(err));
        

        const extPathHeroLogo = vscode.Uri.file(
            path.join(this._extensionPath, 'logos', 'hero2.png')
        );
        const heroUri = webview.asWebviewUri(extPathHeroLogo).toString();

        const extPathPackageJson = vscode.Uri.file(
            path.join(this._extensionPath, './', 'package.json')
        );
        let json = await import(extPathPackageJson.fsPath);
        let settingsObject: SettingsItemsIn = json.contributes.configuration.properties;

        const extPathDetailsJson = vscode.Uri.file(
            path.join(this._extensionPath, './out/configscreen', 'details.json')
        );
        let detailsJson = await import(extPathDetailsJson.fsPath);


        let config = vscode.workspace.getConfiguration('compile-hero');

        let settings: SettingsItems = {};
        for (let i in settingsObject) {
            if (i === undefined) continue;
//console.info('i', i);
            let [_, second] = i.split('.');
            let [first, ...rest] = second.split('-');
            let category = settingsObject[i].csgroup; // first !== 'x' ? 'default' : 'advanced';   // filter specifics
            if (!settings[category]) settings[category] = {};
            if (!settings[category][first]) settings[category][first] = {};

            settings[category][first][i] = {
                key: i,
                caption: rest.join(' ').replace(/\b[a-z]/g, match => match.toUpperCase()),
                current: config.get(second),
                values: config.inspect(second),
                ...settingsObject[i]
            };
        }

        let html = await new Promise<string>((resolve, reject) => {
            pug.renderFile(extPathViewMain.fsPath, {
                webview,
                nonce,
                scriptUri,
                settings,
                lessMain,
                detailsJson,
                heroUri
            }, (err: any, data: string) => { 
                if (err) { vscode.window.activeTerminal?.sendText(err.message); vscode.window.showErrorMessage(err.message); reject(err); } else resolve(data); 
            })
        })

        return html;
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
