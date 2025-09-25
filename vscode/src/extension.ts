import * as vscode from 'vscode';
import { registerEncryptDecryptSelectionCommands } from './commands';
import { decryptFileInEditor } from './decryptProvider';
import { checkGitHubLogin } from './authService';
import { activateStatusBar } from './statusBar';
import { decryptAllInWorkspace } from './commands';
import { DecoratorManager } from './decoratorManager';
export async function activate(context: vscode.ExtensionContext) {
  console.log('CodeCloak extension activated');

  const loginStatus = await checkGitHubLogin();
  activateStatusBar(context, loginStatus);

  // Register main file decrypt command
  const decryptFileCmd = vscode.commands.registerCommand('codecloak.decryptFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    await decryptFileInEditor(editor);
  });

  // Register all smart commands
  registerEncryptDecryptSelectionCommands(context);
  
  // Register decrypt all command
  const decryptAllCmd = vscode.commands.registerCommand('codecloak.decryptAllInWorkspace', decryptAllInWorkspace);
  
  context.subscriptions.push(decryptFileCmd, decryptAllCmd);

  // COMMENT OUT FILE DECORATION - REMOVE FOR NOW
  // Auto-decorate on open
  // vscode.workspace.onDidOpenTextDocument(async (doc) => {
  //   const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
  //   if (editor && (doc.getText().includes('// CODECLOAK') || doc.getText().includes('// [CODECLOAK:ENCRYPTED_BLOCK]') || doc.getText().includes('// CF: '))) {
  //     DecoratorManager.getInstance().refreshFileDecorations(doc.uri);
  //   }
  // });

  // Auto-decorate when content changes
  // vscode.workspace.onDidChangeTextDocument(async (event) => {
  //   const doc = event.document;
  //   if (doc.getText().includes('// CODECLOAK') || doc.getText().includes('// [CODECLOAK:ENCRYPTED_BLOCK]') || doc.getText().includes('// CF: ')) {
  //     DecoratorManager.getInstance().refreshFileDecorations(doc.uri);
  //   }
  // });

  // Auto-refresh file decorations when document is saved
  // vscode.workspace.onDidSaveTextDocument(async (doc) => {
  //   const hasEncryptedContent = doc.getText().includes('// CODECLOAK') || 
  //                              doc.getText().includes('// [CODECLOAK:ENCRYPTED_BLOCK]') || 
  //                              doc.getText().includes('// CF: ');
  //   
  //   if (hasEncryptedContent) {
  //     DecoratorManager.getInstance().refreshFileDecorations(doc.uri);
  //   } else {
  //     // File is now completely decrypted, remove the lock icon
  //     DecoratorManager.getInstance().refreshFileDecorations(doc.uri);
  //   }
  // });
}

export function deactivate() {}