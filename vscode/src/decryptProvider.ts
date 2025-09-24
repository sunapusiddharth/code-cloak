import * as vscode from 'vscode';
import { decryptWholeFile, decryptBlocks, deriveGitHubKeyForVSCode } from './decryptUtils';
import { DecoratorManager } from './decoratorManager';

export async function decryptFileInEditor(editor: vscode.TextEditor) {
  const doc = editor.document;
  let content = doc.getText();

  if (!content.includes('// CODECLOAK')) {
    vscode.window.showWarningMessage('⚠️ Not a CodeCloak encrypted file.');
    return;
  }

  const filepath = doc.fileName;

  let key: Buffer;
  try {
    key = await deriveGitHubKeyForVSCode(filepath);
  } catch (err) {
    vscode.window.showErrorMessage(`🔐 ${err.message}`);
    return;
  }

  let decryptedContent: string;

  try {
    if (content.includes('// CODECLOAK v1.0')) {
      decryptedContent = await decryptWholeFile(content, key);
    } else if (content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
      decryptedContent = await decryptBlocks(content, key);
    } else {
      throw new Error('Unrecognized CodeCloak format');
    }
  } catch (err) {
    vscode.window.showErrorMessage(`🔐 Decryption failed: ${err.message}`);
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length)
  );
  edit.replace(doc.uri, fullRange, decryptedContent);
  await vscode.workspace.applyEdit(edit);

  DecoratorManager.getInstance().refreshBlockDecorations(editor);
  DecoratorManager.getInstance().refreshFileDecorations(doc.uri);

  vscode.window.setStatusBarMessage('🔓 CodeCloak: File Decrypted', 3000);
}