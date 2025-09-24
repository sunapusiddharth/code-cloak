import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { deriveGitHubKey } from '../crypto/githubKeyDeriver.js';
import * as crypto from 'crypto';
import { decryptCodeBlock } from '../utils/smartEncryption.js';
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
export const smartEncryptCommand = new Command('smart-encrypt')
    .description('Encrypt/decrypt only functions in supported programming languages')
    .argument('<filepath>', 'Path to file')
    .option('-e, --encrypt', 'Encrypt functions (default: decrypt)')
    .option('-d, --decrypt', 'Decrypt functions')
    .action(async (filepath, options) => {
    const ext = path.extname(filepath).slice(1).toLowerCase();
    const language = EXTENSION_MAP[ext];
    if (!language || !LANGUAGE_PATTERNS[language]) {
        console.log(`❌ Unsupported file type: .${ext}`);
        console.log(`📋 Supported languages: ${Object.keys(EXTENSION_MAP).filter(ext => EXTENSION_MAP[ext]).join(', ')}`);
        console.log(`💡 Use 'codecloak encrypt' for file-level encryption`);
        return;
    }
    const content = fs.readFileSync(filepath, 'utf8');
    const shouldEncrypt = options.decrypt ? false : true; // Default to encrypt
    if (shouldEncrypt) {
        const encrypted = await encryptFunctions(content, language, filepath);
        if (encrypted !== content) {
            fs.writeFileSync(filepath, encrypted);
            console.log(`✅ Functions encrypted in ${filepath}`);
        }
        else {
            console.log(`ℹ️  No functions found to encrypt in ${filepath}`);
        }
    }
    else {
        const decrypted = await decryptFunctions(content, language, filepath);
        if (decrypted !== content) {
            fs.writeFileSync(filepath, decrypted);
            console.log(`✅ Functions decrypted in ${filepath}`);
        }
        else {
            console.log(`ℹ️  No encrypted functions found in ${filepath}`);
        }
    }
});
async function encryptFunctions(content, language, filepath) {
    const pattern = LANGUAGE_PATTERNS[language];
    if (!pattern)
        return content;
    const key = await deriveGitHubKey(filepath);
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
                    // Function signature line has opening brace, so the rest is function body
                    // Add signature line to result (without the opening brace part)
                    result.push(functionSignatureLine);
                    // Start counting braces from this line
                    braceCount = openBraces - closeBraces;
                    functionBody = [];
                }
                else {
                    // Function signature line doesn't have opening brace, wait for next line
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
// Enhanced Rust function detection - handles complex patterns
function isRustFunctionStart(line) {
    // More comprehensive regex to catch all Rust function patterns
    const rustFnRegex = /\b(?:pub\s+)?(?:async\s+)?(?:unsafe\s+)?\s*fn\s+\w+\s*\([^)]*\)/;
    if (rustFnRegex.test(line)) {
        return true;
    }
    return false;
}
async function decryptFunctions(content, language, filepath) {
    const key = await deriveGitHubKey(filepath);
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
//# sourceMappingURL=smartEncrypt.js.map