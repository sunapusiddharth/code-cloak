import * as vscode from 'vscode';

export function decorateEncryptedBlocks(editor: vscode.TextEditor) {
  const doc = editor.document;
  const decorations: vscode.DecorationOptions[] = [];
  const lines = doc.getText().split('\n');

  // Get extension to determine icon path
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
    const line = lines[i];
    
    // Support both old format and new smart format
    if (line.trim() === '// [CODECLOAK:ENCRYPTED_BLOCK]' || line.includes('// CF: ')) {
      const range = new vscode.Range(i, 0, i, 0);
      decorations.push({ range });
    }
  }

  editor.setDecorations(decorationType, decorations);
}