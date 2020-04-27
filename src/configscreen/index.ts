// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

console.log('Banananaaaaa');

(function () {
    // @ts-ignore
    const vscode: vscode = acquireVsCodeApi();

    /* using state:
        const oldState = vscode.getState();
        console.log(oldState);
        vscode.setState({ count: currentCount });
    */


    document.querySelectorAll('.usersettings').forEach(e =>
        e.addEventListener('click', _ => {
            vscode.postMessage({
                command: 'usersettings',
            });
        })
    );

    document.querySelectorAll('[name][type=checkbox]').forEach(e =>
        e.addEventListener('click', _ => {
            let key = (e as HTMLInputElement).name;
            let prop = (e as HTMLInputElement).checked;

            document.querySelectorAll('[name="' + key + '"]').forEach(el => {
                (el as HTMLInputElement).checked = prop;
                (el as HTMLInputElement).classList.remove('ison');
                (el as HTMLInputElement).classList.remove('isoff');
            });

            vscode.postMessage({
                command: 'change',
                key: key,
                value: prop,
            });
        })
    );

    document.querySelectorAll('[name][type=text]').forEach(e =>
        e.addEventListener('input', _ => {
            let key = (e as HTMLInputElement).name;
            let prop = (e as HTMLInputElement).value;

            document.querySelectorAll('[name="' + key + '"]').forEach(el => {
                (el as HTMLInputElement).value = prop;
            });

            vscode.postMessage({
                command: 'change',
                key: key,
                value: prop !== "" ? prop : undefined, // remove if empty string
            });
        })
    );

    document.querySelectorAll('[data-unset]').forEach(e => {
        let key = (e as HTMLElement).dataset.unset;

        e.addEventListener('click', ev => {
            ev.preventDefault();

            vscode.postMessage({
                command: 'unset',
                key: key,
            });

            document.querySelectorAll('[name="' + key + '"]').forEach(el => {
                let elem: HTMLInputElement = el as HTMLInputElement;
                let type = (el as any).type;
                if (type == 'checkbox') {
                    elem.removeAttribute('checked');
                    elem.checked = false;
                    if (elem.classList.contains('isonbak')) elem.classList.add('ison');
                    if (elem.classList.contains('isoffbak')) elem.classList.add('isoff');
                    elem.classList.remove('isset');
                }
                else
                    elem.value = '';
            });
        })
    });
    
}());