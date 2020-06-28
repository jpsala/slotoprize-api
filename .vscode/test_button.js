exports.execute = async (args) => {
    // args => https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.buttonactionscriptarguments.html

    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode  = args.require('vscode');

    // gotoCursor(args, 3, 1);
    // gotoEnd(args);
    // gotoStart(args);
    // getTextAfterCursor(args);
    // getTextBeforeCursor(args);
    // replaceText(args, 'foo');
    // replaceTextAfterCursor(args, 'foo');

    vscode.window.showInformationMessage(
        getTextAfterCursor(args)
    );
}


// get text from clipboard
async function getClipboardText(args) {
    const vscode = args.require('vscode');

    return await vscode.env.clipboard.readText();
}

// find down from cursor
function getTextAfterCursor(args) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    return ACTIVE_EDITOR.document.getText(new vscode.Range(
        ACTIVE_EDITOR.selection.end,
        new vscode.Position(ACTIVE_EDITOR.document.lineCount + 1, 0),
    ));
}

// find up from cursor
function getTextBeforeCursor(args) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    return ACTIVE_EDITOR.document.getText(new vscode.Range(
        new vscode.Position(0, 0),
        ACTIVE_EDITOR.selection.start
    ));
}

// move cursor within file
function gotoCursor(args, line, column) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    ACTIVE_EDITOR.selection = new vscode.Selection(
        line - 1, column - 1,
        line - 1, column - 1
    );
}

// go to end of file
function gotoEnd(args) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    ACTIVE_EDITOR.selection = new vscode.Selection(
        ACTIVE_EDITOR.document.lineCount + 1, 0,
        ACTIVE_EDITOR.document.lineCount + 1, 0
    );
}

// go to start of file
function gotoStart(args) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    ACTIVE_EDITOR.selection = new vscode.Selection(
        0, 0,
        0, 0
    );
}

// replace text of selection / cursor
function replaceText(args, textToPaste) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    ACTIVE_EDITOR.edit(builder => {
        builder.insert(
            ACTIVE_EDITOR.selection.active, textToPaste
        );
    });
}

// replace down from cursor
function replaceTextAfterCursor(args, newText) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    ACTIVE_EDITOR.edit(builder => {
        builder.replace(
            new vscode.Range(
                ACTIVE_EDITOR.selection.end,
                new vscode.Position(ACTIVE_EDITOR.document.lineCount + 1, 0),
            ),
            newText
        );
    });
}

// replace up from cursor
function replaceTextBeforeCursor(args, newText) {
    const vscode = args.require('vscode');

    const ACTIVE_EDITOR = vscode.window.activeTextEditor;
    ACTIVE_EDITOR.edit(builder => {
        builder.replace(
            new vscode.Range(
                new vscode.Position(0, 0),
                ACTIVE_EDITOR.selection.start
            ),
            newText
        );
    });
}