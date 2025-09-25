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
exports.registerEncryptDecryptSelectionCommands = registerEncryptDecryptSelectionCommands;
exports.decryptAllInWorkspace = decryptAllInWorkspace;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
const authService_1 = require("./authService");
function registerEncryptDecryptSelectionCommands(context) {
    // Smart Encrypt Function Body
    const smartEncryptCmd = vscode.commands.registerCommand('codecloak.smartEncryptFunction', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const content = editor.document.getText();
            const ext = editor.document.fileName.split('.').pop()?.toLowerCase() || '';
            const encrypted = await encryptFunctionBody(content, ext, editor.document.fileName);
            if (encrypted !== content) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
                edit.replace(editor.document.uri, fullRange, encrypted);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('🔐 Function body encrypted');
            }
            else {
                vscode.window.showInformationMessage('No functions found to encrypt');
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Smart encrypt failed: ${err.message}`);
        }
    });
    // Smart Decrypt Function Body
    const smartDecryptCmd = vscode.commands.registerCommand('codecloak.smartDecryptFunction', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const content = editor.document.getText();
            const ext = editor.document.fileName.split('.').pop()?.toLowerCase() || '';
            const decrypted = await decryptFunctionBody(content, ext, editor.document.fileName);
            if (decrypted !== content) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
                edit.replace(editor.document.uri, fullRange, decrypted);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('🔓 Function body decrypted');
            }
            else {
                vscode.window.showInformationMessage('No encrypted functions found');
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Smart decrypt failed: ${err.message}`);
        }
    });
    // Encrypt File (whole file encryption) - ONLY THIS ONE, NO decryptFile
    const encryptFileCmd = vscode.commands.registerCommand('codecloak.encryptFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const content = editor.document.getText();
            const encrypted = await encryptFileContent(content, editor.document.fileName);
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
            edit.replace(editor.document.uri, fullRange, encrypted);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('🔐 File encrypted using GitHub identity');
        }
        catch (err) {
            vscode.window.showErrorMessage(`File encrypt failed: ${err.message}`);
        }
    });
    // DON'T REGISTER decryptFile here - it's already registered in extension.ts
    // const decryptFileCmd = ... (REMOVED - AVOID DUPLICATE)
    context.subscriptions.push(smartEncryptCmd, smartDecryptCmd, encryptFileCmd); // Removed decryptFileCmd
}
// Smart encryption logic
async function encryptFunctionBody(content, ext, filepath) {
    const languageMap = {
        js: 'js', ts: 'ts', py: 'py', go: 'go', java: 'java',
        c: 'c', cpp: 'cpp', rs: 'rust', rust: 'rust'
    };
    const language = languageMap[ext];
    if (!language)
        return content;
    const key = await deriveGitHubKeyForVSCode(filepath);
    const lines = content.split('\n');
    let result = [];
    let inFunction = false;
    let functionStartLine = -1;
    let braceCount = 0;
    let functionBody = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Function detection patterns
        const isFunction = isFunctionStart(line, language);
        if (isFunction && !inFunction) {
            inFunction = true;
            functionStartLine = i;
            braceCount = 0;
            functionBody = [];
            result.push(line); // Add function signature
            continue;
        }
        if (inFunction) {
            // Count braces to find function end
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceCount += openBraces - closeBraces;
            if (braceCount === 0) {
                // Function body is complete, encrypt it
                functionBody.push(line); // Add closing brace to body
                if (functionBody.length > 0) {
                    const functionBodyContent = functionBody.join('\n');
                    const encryptedBody = await encryptCodeBlock(functionBodyContent, key);
                    // Use language-appropriate comments
                    result.push(`// CF: ${encryptedBody}`);
                }
                inFunction = false;
                continue; // Don't add closing brace again
            }
            else {
                // Add line to function body
                functionBody.push(line);
            }
        }
        else {
            result.push(line);
        }
    }
    return result.join('\n');
}
async function decryptFunctionBody(content, ext, filepath) {
    const key = await deriveGitHubKeyForVSCode(filepath);
    const lines = content.split('\n');
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('// CF: ')) {
            const encryptedBlock = line.replace(/\/\/\s*CF:\s*/, '').trim();
            try {
                const decrypted = await decryptCodeBlock(encryptedBlock, key);
                result.push(decrypted);
                continue;
            }
            catch (err) {
                result.push(line); // Keep encrypted if decryption fails
            }
        }
        else {
            result.push(line);
        }
    }
    return result.join('\n');
}
// File encryption/decryption
async function encryptFileContent(content, filepath) {
    const key = await deriveGitHubKeyForVSCode(filepath);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    const metadata = `// CODECLOAK v1.0
// AUTH: github
// IV: ${iv.toString('base64')}
// TAG: ${authTag}
// PATH: ${filepath}
// 
`;
    return metadata + encrypted;
}
async function decryptFileContent(content, filepath) {
    if (content.includes('// CODECLOAK v1.0')) {
        return await decryptWholeFile(content, await deriveGitHubKeyForVSCode(filepath));
    }
    else if (content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
        return await decryptBlocks(content, await deriveGitHubKeyForVSCode(filepath));
    }
    else if (content.includes('// CF: ')) {
        return await decryptFunctionBody(content, filepath.split('.').pop()?.toLowerCase() || '', filepath);
    }
    else {
        throw new Error('Not a CodeCloak encrypted file');
    }
}
// Helper functions
function isFunctionStart(line, language) {
    const patterns = {
        js: [
            /(?:async\s+)?(?:export\s+|function\s+|const\s+\w+\s*=\s*function\s*|(\w+)\s*=\s*\(.*?\)\s*=>)/,
            /(?:async\s+)?(?:export\s+|function\s+|const\s+\w+\s*:\s*\w+\s*=\s*function\s*|(\w+)\s*=\s*\(.*?\)\s*=>)/
        ],
        py: [/def\s+\w+\s*\([^)]*\)\s*:/],
        go: [/func\s+\w+\s*\([^)]*\)\s*{/],
        java: [/(?:public|private|protected)\s+(?:static\s+)?\w+\s+\w+\s*\([^)]*\)\s*{/],
        c: [/(?:static\s+)?\w+\s+\w+\s*\([^)]*\)\s*{/],
        cpp: [/(?:static\s+)?\w+\s+\w+\s*\([^)]*\)\s*{/],
        rust: [/(?:pub\s+)?(?:async\s+)?(?:unsafe\s+)?\s*fn\s+\w+\s*\([^)]*\)/]
    };
    const langPatterns = patterns[language] || [];
    return langPatterns.some(pattern => pattern.test(line));
}
async function encryptCodeBlock(content, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    const cleanEncrypted = encrypted.replace(/\s+/g, '');
    const cleanAuthTag = authTag.replace(/\s+/g, '');
    const cleanIV = iv.toString('base64').replace(/\s+/g, '');
    return `IV:${cleanIV}|TAG:${cleanAuthTag}|${cleanEncrypted}`;
}
async function decryptCodeBlock(encrypted, key) {
    const [meta, cipherText] = encrypted.split('|');
    const [ivPart, tagPart] = meta.split('|');
    const iv = Buffer.from(ivPart.replace('IV:', ''), 'base64');
    const tag = Buffer.from(tagPart.replace('TAG:', ''), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
async function decryptWholeFile(content, key) {
    const lines = content.split('\n');
    let iv = null;
    let authTag = null;
    let cipherText = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('// IV: ')) {
            iv = Buffer.from(line.slice(7), 'base64');
        }
        else if (line.startsWith('// TAG: ')) {
            authTag = Buffer.from(line.slice(8), 'base64');
        }
        else if (!line.startsWith('// ') && line.trim() !== '') {
            cipherText = line;
            break;
        }
    }
    if (!iv || !authTag || !cipherText) {
        throw new Error('❌ Invalid or missing metadata in CodeCloak file.');
    }
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(cipherText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        throw new Error(`Decryption failed. Are you logged into the same GitHub account used for encryption? ${err.message}`);
    }
}
async function decryptBlocks(content, key) {
    const lines = content.split('\n');
    let result = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.trim() === '// [CODECLOAK:ENCRYPTED_BLOCK]') {
            i++;
            if (i >= lines.length)
                break;
            const metaLine = lines[i];
            const match = metaLine.match(/IV:([^|]+)\|TAG:(.+)/);
            if (!match) {
                throw new Error(`Invalid metadata at line ${i}: ${metaLine}`);
            }
            const iv = Buffer.from(match[1], 'base64');
            const authTag = Buffer.from(match[2], 'base64');
            i++;
            if (i >= lines.length)
                break;
            const cipherText = lines[i];
            i++;
            if (i >= lines.length || !lines[i].includes('// [CODECLOAK:END_ENCRYPTED]')) {
                throw new Error('Malformed block: missing end marker');
            }
            try {
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(cipherText, 'base64', 'utf8');
                decrypted += decipher.final('utf8');
                result.push(decrypted);
            }
            catch (err) {
                throw new Error(`Block decryption failed: ${err.message}`);
            }
            i++;
        }
        else {
            result.push(line);
            i++;
        }
    }
    return result.join('\n');
}
async function deriveGitHubKeyForVSCode(filepath) {
    try {
        const token = (await (0, authService_1.execAsync)('gh auth token')).stdout.trim();
        const user = (await (0, authService_1.execAsync)('gh api user --jq .login')).stdout.trim();
        const salt = crypto.createHash('sha256').update(filepath).digest('hex').substring(0, 16);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const material = `${user}-${tokenHash}-${salt}`;
        return crypto.createHash('sha256').update(material).digest();
    }
    catch (err) {
        throw new Error(`Failed to derive key. Are you logged into GitHub? Run 'gh auth login'.\n${err.message}`);
    }
}
async function decryptAllInWorkspace() {
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
        if (!content.includes('// CODECLOAK'))
            continue;
        try {
            const key = await deriveGitHubKeyForVSCode(doc.fileName);
            let decrypted;
            if (content.includes('// CODECLOAK v1.0')) {
                decrypted = await decryptWholeFile(content, key);
            }
            else if (content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
                decrypted = await decryptBlocks(content, key);
            }
            else {
                continue;
            }
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), decrypted);
            await vscode.workspace.applyEdit(edit);
            await doc.save();
            count++;
        }
        catch (err) {
            console.error(`Failed to decrypt ${uri.fsPath}:`, err.message);
        }
    }
    vscode.window.showInformationMessage(`🔓 Decrypted ${count} files in workspace.`);
    vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
}
//# sourceMappingURL=commands.js.map