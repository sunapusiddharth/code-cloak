import * as vscode from 'vscode';

export function activateStatusBar(context: vscode.ExtensionContext, status: { loggedIn: boolean; user?: string }) {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'codecloak.decryptFile';

  if (status.loggedIn) {
    statusBar.text = `$(unlock) CodeCloak: @${status.user}`;
    statusBar.tooltip = "You're logged into GitHub. Encrypted files will auto-decrypt.";
  } else {
    statusBar.text = `$(lock) CodeCloak: Not Logged In`;
    statusBar.tooltip = "Run 'gh auth login' to enable decryption";
  }

  statusBar.show();
  context.subscriptions.push(statusBar);
}