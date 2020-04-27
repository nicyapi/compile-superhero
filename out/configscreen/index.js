"use strict";
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
console.log('Banananaaaaa');
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    /* using state:
        const oldState = vscode.getState();
        console.log(oldState);
        vscode.setState({ count: currentCount });
    */
    document.querySelectorAll('.usersettings').forEach(e => e.addEventListener('click', _ => {
        vscode.postMessage({
            command: 'usersettings',
        });
    }));
    document.querySelectorAll('[name][type=checkbox]').forEach(e => e.addEventListener('click', _ => {
        let key = e.name;
        let prop = e.checked;
        document.querySelectorAll('[name="' + key + '"]').forEach(el => {
            el.checked = prop;
            el.classList.remove('ison');
            el.classList.remove('isoff');
        });
        vscode.postMessage({
            command: 'change',
            key: key,
            value: prop,
        });
    }));
    document.querySelectorAll('[name][type=text]').forEach(e => e.addEventListener('input', _ => {
        let key = e.name;
        let prop = e.value;
        document.querySelectorAll('[name="' + key + '"]').forEach(el => {
            el.value = prop;
        });
        vscode.postMessage({
            command: 'change',
            key: key,
            value: prop !== "" ? prop : undefined,
        });
    }));
    document.querySelectorAll('[data-unset]').forEach(e => {
        let key = e.dataset.unset;
        e.addEventListener('click', ev => {
            ev.preventDefault();
            vscode.postMessage({
                command: 'unset',
                key: key,
            });
            document.querySelectorAll('[name="' + key + '"]').forEach(el => {
                let elem = el;
                let type = el.type;
                if (type == 'checkbox') {
                    elem.removeAttribute('checked');
                    elem.checked = false;
                    if (elem.classList.contains('isonbak'))
                        elem.classList.add('ison');
                    if (elem.classList.contains('isoffbak'))
                        elem.classList.add('isoff');
                    elem.classList.remove('isset');
                }
                else
                    elem.value = '';
            });
        });
    });
}());
//# sourceMappingURL=index.js.map