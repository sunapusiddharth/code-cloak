import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { execAsync, getGitHubToken } from './authService';
import { DecoratorManager } from './decoratorManager';
import { deriveGitHubKeyForVSCode, decryptWholeFile, decryptBlocks } from './decryptUtils';

export function registerEncryptDecryptSelectionCommands(context: vscode.ExtensionContext) {
  const encryptCmd = vscode.commands.registerCommand('codecloak.encryptSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showWarningMessage('Select text to encrypt.');
      return;
    }

    try {
      const selectedText = editor.document.getText(selection);
      const encryptedBlock = await encryptTextBlock(selectedText, editor.document.fileName);

      await editor.edit(editBuilder => {
        editBuilder.replace(selection, encryptedBlock);
      });

      DecoratorManager.getInstance().refreshBlockDecorations(editor);
      DecoratorManager.getInstance().refreshFileDecorations(editor.document.uri);

      vscode.window.setStatusBarMessage('🔐 Selection encrypted', 3000);
    } catch (err) {
      vscode.window.showErrorMessage(`Encrypt failed: ${err.message}`);
    }
  });

  const decryptCmd = vscode.commands.registerCommand('codecloak.decryptSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showWarningMessage('Select encrypted block to decrypt.');
      return;
    }

    const selectedText = editor.document.getText(selection);
    if (!selectedText.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
      vscode.window.showWarningMessage('Selection is not a CodeCloak encrypted block.');
      return;
    }

    try {
      const decrypted = await decryptTextBlock(selectedText, editor.document.fileName);
      await editor.edit(editBuilder => {
        editBuilder.replace(selection, decrypted);
      });

      DecoratorManager.getInstance().refreshBlockDecorations(editor);
      DecoratorManager.getInstance().refreshFileDecorations(editor.document.uri);

      vscode.window.setStatusBarMessage('🔓 Selection decrypted', 3000);
    } catch (err) {
      vscode.window.showErrorMessage(`Decrypt failed: ${err.message}`);
    }
  });

  context.subscriptions.push(encryptCmd, decryptCmd);
}

async function encryptTextBlock(text: string, filepath: string): Promise<string> {
  const token = await getGitHubToken();
  const user = (await execAsync('gh api user --jq .login')).stdout.trim();
  const salt = crypto.createHash('sha256').update(filepath).digest('hex').substring(0, 16);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const material = `${user}-${tokenHash}-${salt}`;
  const key = crypto.createHash('sha256').update(material).digest();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return `// [CODECLOAK:ENCRYPTED_BLOCK]
// IV:${iv.toString('base64')}|TAG:${authTag}
${encrypted}
// [CODECLOAK:END_ENCRYPTED]`;
}

async function decryptTextBlock(block: string, filepath: string): Promise<string> {
  const lines = block.split('\n');
  if (lines.length < 3 || !lines[0].includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
    throw new Error('Invalid encrypted block format');
  }

  const metaLine = lines[1];
  const cipherText = lines[2];

  const match = metaLine.match(/IV:([^|]+)\|TAG:(.+)/);
  if (!match) throw new Error('Invalid metadata');

  const iv = Buffer.from(match[1], 'base64');
  const tag = Buffer.from(match[2], 'base64');

  const token = await getGitHubToken();
  const user = (await execAsync('gh api user --jq .login')).stdout.trim();
  const salt = crypto.createHash('sha256').update(filepath).digest('hex').substring(0, 16);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const material = `${user}-${tokenHash}-${salt}`;
  const key = crypto.createHash('sha256').update(material).digest();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(cipherText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export async function decryptAllInWorkspace() {
  const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!rootPath) {
    vscode.window.showErrorMessage('No workspace open.');
    return;
  }

  const defaultExcludes = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/README.md', '**/LICENSE'];
  const uris = await vscode.workspace.findFiles('**/*', `{${defaultExcludes.join(',')}}`);

  let count = 0;
  for (const uri of uris) {
    const doc = await vscode.workspace.openTextDocument(uri);
    let content = doc.getText();

    if (!content.includes('// CODECLOAK')) continue;

    try {
      const key = await deriveGitHubKeyForVSCode(doc.fileName);
      let decrypted: string;

      if (content.includes('// CODECLOAK v1.0')) {
        decrypted = await decryptWholeFile(content, key);
      } else if (content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
        decrypted = await decryptBlocks(content, key);
      } else {
        continue;
      }

      const edit = new vscode.WorkspaceEdit();
      edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), decrypted);
      await vscode.workspace.applyEdit(edit);
      await doc.save();

      count++;
    } catch (err) {
      console.error(`Failed to decrypt ${uri.fsPath}:`, err.message);
    }
  }

  vscode.window.showInformationMessage(`🔓 Decrypted ${count} files in workspace.`);
  vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
  DecoratorManager.getInstance().refreshFileDecorations();
}