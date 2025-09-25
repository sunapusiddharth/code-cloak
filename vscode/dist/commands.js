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
const decoratorManager_1 = require("./decoratorManager");
// Language patterns - MATCH CLI EXACTLY
const LANGUAGE_PATTERNS = {
    js: {
        pattern: /((?:async\s+)?(?:export\s+|function\s+|const\s+\w+\s*=\s*function\s*|(\w+)\s*=\s*\(.*?\)\s*=>))/,
        endPattern: /}/g,
        comment: '//',
        multilineCommentStart: '/*',
        multilineCommentEnd: '*/'
    },
    ts: {
        pattern: /((?:async\s+)?(?:export\s+|function\s+|const\s+\w+\s*:\s*\w+\s*=\s*function\s*|(\w+)\s*=\s*\(.*?\)\s*=>))/,
        endPattern: /}/g,
        comment: '//',
        multilineCommentStart: '/*',
        multilineCommentEnd: '*/'
    },
    py: {
        pattern: /(def\s+\w+\s*\([^)]*\)\s*:)/,
        endPattern: /^\s*$/gm,
        comment: '#'
    },
    go: {
        pattern: /(func\s+\w+\s*\([^)]*\)\s*{)/,
        endPattern: /}/g,
        comment: '//'
    },
    java: {
        pattern: /((?:public|private|protected)\s+(?:static\s+)?\w+\s+\w+\s*\([^)]*\s*\)\s*{)/,
        endPattern: /}/g,
        comment: '//',
        multilineCommentStart: '/*',
        multilineCommentEnd: '*/'
    },
    c: {
        pattern: /((?:static\s+)?\w+\s+\w+\s*\([^)]*\)\s*{)/,
        endPattern: /}/g,
        comment: '//',
        multilineCommentStart: '/*',
        multilineCommentEnd: '*/'
    },
    cpp: {
        pattern: /((?:static\s+)?\w+\s+\w+\s*\([^)]*\)\s*{)/,
        endPattern: /}/g,
        comment: '//',
        multilineCommentStart: '/*',
        multilineCommentEnd: '*/'
    },
    rust: {
        pattern: /((?:pub\s+)?(?:async\s+)?(?:unsafe\s+)?fn\s+\w+\s*\([^)]*\)\s*(?:->\s*[^{]*)?\s*{)/,
        endPattern: /}/g,
        comment: '//'
    }
};
// Extension mapping - MATCH CLI EXACTLY
const EXTENSION_MAP = {
    js: 'js',
    ts: 'ts',
    py: 'py',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    h: 'c',
    hpp: 'cpp',
    rs: 'rust',
    rust: 'rust'
};
function registerEncryptDecryptSelectionCommands(context) {
    // Smart Encrypt Function Body - MATCH CLI LOGIC EXACTLY
    const smartEncryptCmd = vscode.commands.registerCommand('codecloak.smartEncryptFunction', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const content = editor.document.getText();
            const ext = editor.document.fileName.split('.').pop()?.toLowerCase() || '';
            const encrypted = await encryptFunctionsInVSCode(content, ext, editor.document.fileName);
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
    // Smart Decrypt Function Body - MATCH CLI LOGIC EXACTLY
    const smartDecryptCmd = vscode.commands.registerCommand('codecloak.smartDecryptFunction', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const content = editor.document.getText();
            const ext = editor.document.fileName.split('.').pop()?.toLowerCase() || '';
            const decrypted = await decryptFunctionsInVSCode(content, ext, editor.document.fileName);
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
    // Encrypt File (whole file encryption)
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
    const encryptSelectionCmd = vscode.commands.registerCommand('codecloak.encryptSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
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
            decoratorManager_1.DecoratorManager.getInstance().refreshBlockDecorations(editor);
            decoratorManager_1.DecoratorManager.getInstance().refreshFileDecorations(editor.document.uri);
            vscode.window.setStatusBarMessage('🔐 Selection encrypted', 3000);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Encrypt failed: ${err.message}`);
        }
    });
    // NEW: Decrypt Selection
    const decryptSelectionCmd = vscode.commands.registerCommand('codecloak.decryptSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Select encrypted block to decrypt.');
            return;
        }
        const selectedText = editor.document.getText(selection);
        if (!selectedText.includes('// [CODECLOAK:ENCRYPTED_BLOCK]') && !selectedText.includes('// CF: ')) {
            vscode.window.showWarningMessage('Selection is not a CodeCloak encrypted block.');
            return;
        }
        try {
            let decrypted;
            if (selectedText.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
                decrypted = await decryptTextBlock(selectedText, editor.document.fileName);
            }
            else if (selectedText.includes('// CF: ')) {
                const encryptedBlock = selectedText.replace(/\/\/\s*CF:\s*/, '').trim();
                const key = await deriveGitHubKeyForVSCode(editor.document.fileName);
                decrypted = await decryptCodeBlock(encryptedBlock, key);
            }
            else {
                throw new Error('Invalid encrypted format');
            }
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, decrypted);
            });
            // ONLY refresh block decorations, REMOVE file decorations
            decoratorManager_1.DecoratorManager.getInstance().refreshBlockDecorations(editor);
            // NO FILE DECORATION REFRESH - REMOVED
            // await refreshFileDecoration(editor.document); // REMOVED
            vscode.window.setStatusBarMessage('🔓 Selection decrypted', 3000);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Decrypt failed: ${err.message}`);
        }
    });
    context.subscriptions.push(smartEncryptCmd, smartDecryptCmd, encryptFileCmd, encryptSelectionCmd, decryptSelectionCmd);
}
// NEW: Encrypt selected text
async function encryptTextBlock(text, filepath) {
    const key = await deriveGitHubKeyForVSCode(filepath);
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
// NEW: Decrypt selected text
async function decryptTextBlock(block, filepath) {
    const lines = block.split('\n');
    if (lines.length < 3 || !lines[0].includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
        throw new Error('Invalid encrypted block format');
    }
    const metaLine = lines[1];
    const cipherText = lines[2];
    const match = metaLine.match(/IV:([^|]+)\|TAG:(.+)/);
    if (!match)
        throw new Error('Invalid metadata');
    const iv = Buffer.from(match[1], 'base64');
    const tag = Buffer.from(match[2], 'base64');
    const key = await deriveGitHubKeyForVSCode(filepath);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
// ENCRYPT FUNCTIONS - MATCH CLI EXACTLY
async function encryptFunctionsInVSCode(content, ext, filepath) {
    // Map extension to language (like CLI)
    const language = EXTENSION_MAP[ext];
    if (!language || !LANGUAGE_PATTERNS[language])
        return content;
    const pattern = LANGUAGE_PATTERNS[language];
    const key = await deriveGitHubKeyForVSCode(filepath);
    const lines = content.split('\n');
    let result = [];
    let inFunction = false;
    let functionStartLine = -1;
    let braceCount = 0;
    let functionBody = [];
    let functionSignatureLine = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Handle Rust-specific syntax with enhanced detection
        if (language === 'rust') {
            if (isRustFunctionStart(line) && !inFunction) {
                inFunction = true;
                functionStartLine = i;
                functionSignatureLine = line;
                // Check if the function signature line contains the opening brace
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;
                if (openBraces > 0) {
                    result.push(functionSignatureLine);
                    braceCount = openBraces - closeBraces;
                    functionBody = [];
                }
                else {
                    result.push(line);
                    braceCount = 0;
                    functionBody = [];
                }
                continue;
            }
        }
        else {
            // For other languages, use pattern matching
            const regex = new RegExp(pattern.pattern.source, 'i');
            if (regex.test(line) && !inFunction) {
                inFunction = true;
                functionStartLine = i;
                functionSignatureLine = line;
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;
                if (openBraces > 0) {
                    result.push(functionSignatureLine);
                    braceCount = openBraces - closeBraces;
                    functionBody = [];
                }
                else {
                    result.push(line);
                    braceCount = 0;
                    functionBody = [];
                }
                continue;
            }
        }
        if (inFunction) {
            // Count braces to find function end
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceCount += openBraces - closeBraces;
            if (braceCount === 0) {
                // Function body is complete, encrypt the collected body
                if (functionBody.length > 0) {
                    const functionBodyContent = functionBody.join('\n');
                    const encryptedBody = await encryptCodeBlock(functionBodyContent, key);
                    // Use language-appropriate comments
                    if (pattern.multilineCommentStart && pattern.multilineCommentEnd) {
                        // Use multiline comments for JS/Java/C/C++
                        result.push(`${pattern.multilineCommentStart} CF: ${encryptedBody} ${pattern.multilineCommentEnd}`);
                    }
                    else {
                        // Use single-line comments for Python/Rust
                        result.push(`${pattern.comment} CF: ${encryptedBody}`);
                    }
                }
                // Add the closing brace (not encrypted)
                result.push(line);
                inFunction = false;
                functionSignatureLine = null;
                continue;
            }
            else {
                // Add line to function body to be encrypted
                functionBody.push(line);
            }
        }
        else {
            result.push(line);
        }
    }
    return result.join('\n');
}
// DECRYPT FUNCTIONS - MATCH CLI EXACTLY
async function decryptFunctionsInVSCode(content, ext, filepath) {
    // Map extension to language (like CLI)
    const language = EXTENSION_MAP[ext];
    if (!language || !LANGUAGE_PATTERNS[language])
        return content;
    const key = await deriveGitHubKeyForVSCode(filepath);
    const lines = content.split('\n');
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for both single-line and multi-line comment formats
        if (line.includes('// CF: ') || line.includes('/* CF: ') || line.includes('# CF: ')) {
            let encryptedBlock = '';
            if (line.includes('/* CF: ')) {
                // Multi-line comment format: /* CF: ... */
                const match = line.match(/\/\*\s*CF:\s*(.*?)\s*\*\//);
                if (match)
                    encryptedBlock = match[1];
            }
            else if (line.includes('// CF: ')) {
                // Single-line comment format: // CF:
                encryptedBlock = line.replace(/\/\/\s*CF:\s*/, '').trim();
            }
            else if (line.includes('# CF: ')) {
                // Python comment format: # CF:
                encryptedBlock = line.replace(/#\s*CF:\s*/, '').trim();
            }
            if (encryptedBlock) {
                try {
                    const decrypted = await decryptCodeBlock(encryptedBlock, key);
                    result.push(decrypted);
                    continue;
                }
                catch (err) {
                    console.error(`⚠️ Failed to decrypt function: ${err.message}`);
                    result.push(line); // Keep encrypted if decryption fails
                }
            }
        }
        result.push(line);
    }
    return result.join('\n');
}
// Helper functions
function isRustFunctionStart(line) {
    // More comprehensive regex to catch all Rust function patterns
    const rustFnRegex = /\b(?:pub\s+)?(?:async\s+)?(?:unsafe\s+)?\s*fn\s+\w+\s*\([^)]*\)/;
    if (rustFnRegex.test(line)) {
        return true;
    }
    return false;
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
    // Ensure no newlines in the encrypted content to prevent syntax issues
    const cleanEncrypted = encrypted.replace(/\s+/g, '');
    const cleanAuthTag = authTag.replace(/\s+/g, '');
    const cleanIV = iv.toString('base64').replace(/\s+/g, '');
    return `IV:${cleanIV}|TAG:${cleanAuthTag}|${cleanEncrypted}`;
}
async function decryptCodeBlock(encrypted, key) {
    // Parse: IV:...|TAG:...|encrypted_data
    const parts = encrypted.split('|');
    if (parts.length < 3) {
        throw new Error(`Invalid encrypted format: expected at least 3 parts, got ${parts.length}`);
    }
    const ivPart = parts[0];
    const tagPart = parts[1];
    const cipherText = parts.slice(2).join('|'); // Handle case where cipherText contains '|'
    if (!ivPart || typeof ivPart !== 'string' || !ivPart.includes('IV:')) {
        throw new Error(`Invalid IV format: "${ivPart}", expected IV:...`);
    }
    if (!tagPart || typeof tagPart !== 'string' || !tagPart.includes('TAG:')) {
        throw new Error(`Invalid TAG format: "${tagPart}", expected TAG:...`);
    }
    const ivStr = ivPart.replace('IV:', '');
    const tagStr = tagPart.replace('TAG:', '');
    const iv = Buffer.from(ivStr, 'base64');
    const tag = Buffer.from(tagStr, 'base64');
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
// // NEW: Function to check and update file decoration
// async function refreshFileDecoration(doc: vscode.TextDocument) {
//   const hasEncryptedContent = doc.getText().includes('// CODECLOAK') ||
//     doc.getText().includes('// [CODECLOAK:ENCRYPTED_BLOCK]') ||
//     doc.getText().includes('// CF: ');
//   // If no encrypted content, remove the file decoration
//   if (!hasEncryptedContent) {
//     DecoratorManager.getInstance().refreshFileDecorations(doc.uri);
//   }
// }
//# sourceMappingURL=commands.js.map