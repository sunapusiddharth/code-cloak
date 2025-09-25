"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoratorManager = void 0;
const vscode = __importStar(require("vscode"));
const blockDecorator_1 = require("./blockDecorator");
class DecoratorManager {
    static instance;
    fileDecorationProvider;
    _onDidChangeFileDecorations = new vscode.EventEmitter();
    constructor() {
        this.fileDecorationProvider = new (class {
            onDidChangeFileDecorations;
            provideFileDecoration(uri) {
                try {
                    // Get the document from workspace
                    const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri.fsPath);
                    let content = '';
                    if (doc) {
                        content = doc.getText();
                    }
                    else {
                        // If document is not in memory, read from file system
                        try {
                            const fs = require('fs');
                            content = fs.readFileSync(uri.fsPath, 'utf8');
                        }
                        catch {
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
                }
                catch {
                    return undefined;
                }
            }
        })();
        vscode.window.registerFileDecorationProvider(this.fileDecorationProvider);
    }
    static getInstance() {
        if (!DecoratorManager.instance) {
            DecoratorManager.instance = new DecoratorManager();
        }
        return DecoratorManager.instance;
    }
    refreshFileDecorations(uris) {
        if (uris) {
            this._onDidChangeFileDecorations.fire(uris);
        }
        else {
            // Fire event for all text documents to refresh their decorations
            const allUris = vscode.workspace.textDocuments.map(doc => doc.uri);
            this._onDidChangeFileDecorations.fire(allUris);
        }
    }
    onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    refreshBlockDecorations(editor) {
        (0, blockDecorator_1.decorateEncryptedBlocks)(editor);
    }
}
exports.DecoratorManager = DecoratorManager;
//# sourceMappingURL=decoratorManager.js.map