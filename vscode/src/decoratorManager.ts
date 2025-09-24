import * as vscode from 'vscode';
import { decorateEncryptedBlocks } from './blockDecorator';

export class DecoratorManager {
  private static instance: DecoratorManager;
  private fileDecorationProvider: vscode.FileDecorationProvider;

  private constructor() {
    this.fileDecorationProvider = new (class implements vscode.FileDecorationProvider {
      onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[]>;
      provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri.fsPath);
        if (!doc) return undefined;
        const content = doc.getText();
        if (content.includes('// CODECLOAK') || content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
          return new vscode.FileDecoration('🔒', 'Contains encrypted content');
        }
        return undefined;
      }
    })();
    vscode.window.registerFileDecorationProvider(this.fileDecorationProvider);
  }

  public static getInstance(): DecoratorManager {
    if (!DecoratorManager.instance) {
      DecoratorManager.instance = new DecoratorManager();
    }
    return DecoratorManager.instance;
  }

 public refreshFileDecorations(uris?: vscode.Uri | vscode.Uri[]) {
  if (uris) {
    this._onDidChangeFileDecorations.fire(uris);
  } else {
    const urisToRefresh = vscode.workspace.textDocuments.map(doc => doc.uri);
    this._onDidChangeFileDecorations.fire(urisToRefresh);
  }
}
private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
public readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;


  public refreshBlockDecorations(editor: vscode.TextEditor) {
    decorateEncryptedBlocks(editor);
  }
}