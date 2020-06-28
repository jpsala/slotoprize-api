exports.execute = (args) => {
    // args => https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.workspacecommandscriptarguments.html

    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');
    // let uri = vscode.Uri.file("/mnt/1t/prg/api/src")
    // let success = await vscode.commands.executeCommand('vscode.openFolder', uri, true);
    vscode.window.showInformationMessage('Hola')
    console.log('detalle');

    return null
};