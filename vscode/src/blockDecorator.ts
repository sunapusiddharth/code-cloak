import * as vscode from 'vscode';

export function decorateEncryptedBlocks(editor: vscode.TextEditor) {
  const doc = editor.document;
  const decorations: vscode.DecorationOptions[] = [];
  const lines = doc.getText().split('\n');

  const extensionUri = vscode.extensions.getExtension('your-publisher.codecloak')!.extensionUri;

  const decorationType = vscode.window.createTextEditorDecorationType({
    light: {
      gutterIconPath: vscode.Uri.joinPath(extensionUri, 'resources', 'lock-light.svg'),
      gutterIconSize: 'contain'
    },
    dark: {
      gutterIconPath: vscode.Uri.joinPath(extensionUri, 'resources', 'lock-dark.svg'),
      gutterIconSize: 'contain'
    }
  });


  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '// [CODECLOAK:ENCRYPTED_BLOCK]') {
      const range = new vscode.Range(i, 0, i, 0);
      decorations.push({ range });
    }
  }

  editor.setDecorations(decorationType, decorations);
}
