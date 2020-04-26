import * as path from 'path';
import * as vscode from 'vscode';
import * as fsO from 'fs';
const fs = fsO.promises;


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('configScreen.start', () => {
            SuperheroConfigPanel.createOrShow(context.extensionPath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('configScreen.doRefactor', () => {
            if (SuperheroConfigPanel.currentPanel) {
                SuperheroConfigPanel.currentPanel.doRefactor();
            }
        })
    );

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
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }

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
        
        //this._panel.title = catName;
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
        const scriptUri = webview.asWebviewUri(extPathScript);

        // the markup of our view
        const extPathViewMain = vscode.Uri.file(
            path.join(this._extensionPath, 'out/configscreen', 'index.html')
        );    
        let html = await fs.readFile(extPathViewMain.fsPath, { encoding: 'utf8' });


        const extPathPackageJson = vscode.Uri.file(
            path.join(this._extensionPath, './', 'package.json')
        );
        let json = await import(extPathPackageJson.fsPath);
        let settings = json.contributes.configuration.properties;


        html = this.parseStringTemplate(html, {
            webview_cspSource: webview.cspSource,
            nonce,
            scriptUri,
            settings: JSON.stringify(settings)
        });

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

    // https://stackoverflow.com/a/59084440/1644202
    // only SHALLOW obj may be provided
    private parseStringTemplate(str: string, obj: any) {
        let parts: string[] = str.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/);
        let args = str.match(/[^{\}]+(?=})/g) || [];
        let parameters = args.map(argument => obj[argument] || (obj[argument] === undefined ? "" : obj[argument]));
        let a0:any = { raw: parts };
        return String.raw(a0, ...parameters);
    }
}
