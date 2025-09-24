import * as vscode from 'vscode';
import { decryptFileInEditor } from './decryptProvider';
import { checkGitHubLogin } from './authService';
import { activateStatusBar } from './statusBar';
import { registerEncryptDecryptSelectionCommands } from './commands';
import { decryptAllInWorkspace } from './commands';
import { DecoratorManager } from './decoratorManager';

export async function activate(context: vscode.ExtensionContext) {
  console.log('CodeCloak activated');

  const loginStatus = await checkGitHubLogin();
  activateStatusBar(context, loginStatus);

  // Register commands
  const decryptFileCmd = vscode.commands.registerCommand('codecloak.decryptFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    await decryptFileInEditor(editor);
  });

  registerEncryptDecryptSelectionCommands(context);
  
  const decryptAllCmd = vscode.commands.registerCommand('codecloak.decryptAllInWorkspace', decryptAllInWorkspace);
  
  context.subscriptions.push(decryptFileCmd, decryptAllCmd);

  // Auto-decorate on open
  vscode.workspace.onDidOpenTextDocument(async (doc) => {
    const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
    if (editor && (doc.getText().includes('// CODECLOAK') || doc.getText().includes('// [CODECLOAK:ENCRYPTED_BLOCK]'))) {
      DecoratorManager.getInstance().refreshBlockDecorations(editor);
    }
  });
}

export function deactivate() {}