import * as vscode from 'vscode';
import { decorateEncryptedBlocks } from './blockDecorator';

export class DecoratorManager {
  private static instance: DecoratorManager;
  private fileDecorationProvider: vscode.FileDecorationProvider;
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();

  private constructor() {
    this.fileDecorationProvider = new (class implements vscode.FileDecorationProvider {
      onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[]>;
      
      provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        try {
          // Get the document from workspace
          const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri.fsPath);
          let content = '';
          
          if (doc) {
            content = doc.getText();
          } else {
            // If document is not in memory, read from file system
            try {
              const fs = require('fs');
              content = fs.readFileSync(uri.fsPath, 'utf8');
            } catch {
              return undefined;
            }
          }
          
          // Check for encrypted content markers
          const hasEncryptedContent = content.includes('// CODECLOAK') || 
                                     content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]') || 
                                     content.includes('// CF: ');
          
          if (hasEncryptedContent) {
            return new vscode.FileDecoration('🔒', 'Contains encrypted content');
          }
          return undefined;
        } catch {
          return undefined;
        }
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
      // Fire event for all text documents to refresh their decorations
      const allUris = vscode.workspace.textDocuments.map(doc => doc.uri);
      this._onDidChangeFileDecorations.fire(allUris);
    }
  }

  public readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  public refreshBlockDecorations(editor: vscode.TextEditor) {
    decorateEncryptedBlocks(editor);
  }
}