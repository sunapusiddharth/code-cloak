import * as vscode from 'vscode';
import { registerEncryptDecryptSelectionCommands } from './commands';
import { decryptFileInEditor } from './decryptProvider';  // Keep this!
import { checkGitHubLogin } from './authService';
import { activateStatusBar } from './statusBar';
import { decryptAllInWorkspace } from './commands';

export async function activate(context: vscode.ExtensionContext) {
  console.log('CodeCloak extension activated');

  const loginStatus = await checkGitHubLogin();
  activateStatusBar(context, loginStatus);

  // Register main file decrypt command (keep this!)
  const decryptFileCmd = vscode.commands.registerCommand('codecloak.decryptFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    await decryptFileInEditor(editor);
  });

  // Register all smart commands (from commands.ts)
  registerEncryptDecryptSelectionCommands(context);
  
  // Register decrypt all command
  const decryptAllCmd = vscode.commands.registerCommand('codecloak.decryptAllInWorkspace', decryptAllInWorkspace);
  
  context.subscriptions.push(decryptFileCmd, decryptAllCmd);

  // Auto-decorate on open
  vscode.workspace.onDidOpenTextDocument(async (doc) => {
    const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
    if (editor && (doc.getText().includes('// CODECLOAK') || doc.getText().includes('// [CODECLOAK:ENCRYPTED_BLOCK]') || doc.getText().includes('// CF: '))) {
      // Add decorator refresh here if needed
    }
  });
}

export function deactivate() {}