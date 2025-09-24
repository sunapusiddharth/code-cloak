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
exports.decryptFileInEditor = decryptFileInEditor;
const vscode = __importStar(require("vscode"));
const decryptUtils_1 = require("./decryptUtils");
const decoratorManager_1 = require("./decoratorManager");
async function decryptFileInEditor(editor) {
    const doc = editor.document;
    let content = doc.getText();
    if (!content.includes('// CODECLOAK')) {
        vscode.window.showWarningMessage('⚠️ Not a CodeCloak encrypted file.');
        return;
    }
    const filepath = doc.fileName;
    let key;
    try {
        key = await (0, decryptUtils_1.deriveGitHubKeyForVSCode)(filepath);
    }
    catch (err) {
        vscode.window.showErrorMessage(`🔐 ${err.message}`);
        return;
    }
    let decryptedContent;
    try {
        if (content.includes('// CODECLOAK v1.0')) {
            decryptedContent = await (0, decryptUtils_1.decryptWholeFile)(content, key);
        }
        else if (content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
            decryptedContent = await (0, decryptUtils_1.decryptBlocks)(content, key);
        }
        else {
            throw new Error('Unrecognized CodeCloak format');
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`🔐 Decryption failed: ${err.message}`);
        return;
    }
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
    edit.replace(doc.uri, fullRange, decryptedContent);
    await vscode.workspace.applyEdit(edit);
    decoratorManager_1.DecoratorManager.getInstance().refreshBlockDecorations(editor);
    decoratorManager_1.DecoratorManager.getInstance().refreshFileDecorations(doc.uri);
    vscode.window.setStatusBarMessage('🔓 CodeCloak: File Decrypted', 3000);
}
//# sourceMappingURL=decryptProvider.js.map