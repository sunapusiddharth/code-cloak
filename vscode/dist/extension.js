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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const commands_1 = require("./commands");
const decryptProvider_1 = require("./decryptProvider");
const authService_1 = require("./authService");
const statusBar_1 = require("./statusBar");
const commands_2 = require("./commands");
async function activate(context) {
    console.log('CodeCloak extension activated');
    const loginStatus = await (0, authService_1.checkGitHubLogin)();
    (0, statusBar_1.activateStatusBar)(context, loginStatus);
    // Register main file decrypt command
    const decryptFileCmd = vscode.commands.registerCommand('codecloak.decryptFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        await (0, decryptProvider_1.decryptFileInEditor)(editor);
    });
    // Register all smart commands
    (0, commands_1.registerEncryptDecryptSelectionCommands)(context);
    // Register decrypt all command
    const decryptAllCmd = vscode.commands.registerCommand('codecloak.decryptAllInWorkspace', commands_2.decryptAllInWorkspace);
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
function deactivate() { }
//# sourceMappingURL=extension.js.map