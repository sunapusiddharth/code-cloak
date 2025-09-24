import * as crypto from 'crypto';
import { deriveGitHubKey } from '../crypto/githubKeyDeriver.js';
// Language patterns (same as smartEncrypt.ts)
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
// Extension mapping (same as smartEncrypt.ts)
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
export async function encryptFunctionsInFile(content, ext, filepath) {
    // Map extension to language
    const language = EXTENSION_MAP[ext];
    if (!language || !LANGUAGE_PATTERNS[language])
        return content;
    const pattern = LANGUAGE_PATTERNS[language];
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
export async function decryptFunctionsInFile(content, ext, filepath) {
    // Map extension to language
    const language = EXTENSION_MAP[ext];
    if (!language || !LANGUAGE_PATTERNS[language])
        return content;
    const pattern = LANGUAGE_PATTERNS[language];
    const key = await deriveGitHubKey(filepath);
    const lines = content.split('\n');
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for encrypted function body markers
        if (line.includes(' CF: ')) { // Look for " CF: " (space before CF)
            console.log(`🔍 Found encrypted line: "${line}"`);
            let encryptedBlock = '';
            // Multi-line comment format: /* CF: ... */
            const multilineMatch = line.match(/\/\*\s*CF:\s*(.*?)\s*\*\//);
            if (multilineMatch && multilineMatch[1]) {
                console.log(`   Multi-line match: "${multilineMatch[1]}"`);
                encryptedBlock = multilineMatch[1];
            }
            // Single-line comment format: // CF:
            else if (line.includes('// CF: ')) {
                console.log(`   Processing single-line comment...`);
                const match = line.match(/\/\/\s*CF:\s*(.+)/);
                console.log(`   Regex match result:`, match);
                if (match) {
                    console.log(`   match[0] (full match): "${match[0]}"`);
                    console.log(`   match[1] (captured): "${match[1] ? match[1] : 'UNDEFINED'}"`);
                }
                if (match && match[1]) {
                    encryptedBlock = match[1];
                    console.log(`   Extracted encryptedBlock: "${encryptedBlock}"`);
                }
                else {
                    console.log(`   ❌ Single-line match failed! match=${match}, match[1]=${match ? match[1] : 'undefined'}`);
                }
            }
            // Python comment format: # CF:
            else if (line.includes('# CF: ')) {
                const match = line.match(/#\s*CF:\s*(.+)/);
                if (match && match[1]) {
                    encryptedBlock = match[1];
                }
            }
            console.log(`   Final encryptedBlock: "${encryptedBlock}", type: ${typeof encryptedBlock}`);
            if (encryptedBlock) {
                try {
                    console.log(`   About to decrypt: "${encryptedBlock.substring(0, 50)}..."`);
                    const decrypted = await decryptCodeBlock(encryptedBlock, key);
                    console.log(`   Decrypted successfully!`);
                    result.push(decrypted);
                    continue;
                }
                catch (err) {
                    console.error(`⚠️ Failed to decrypt function: ${err.message}`);
                    console.error(`   Error details:`, err);
                    result.push(line); // Keep encrypted if decryption fails
                }
            }
            else {
                console.log(`   ❌ No encrypted block extracted, keeping original line`);
                result.push(line);
            }
        }
        else {
            result.push(line);
        }
    }
    return result.join('\n');
}
// Enhanced Rust function detection - handles complex generics
function isRustFunctionStart(line) {
    // Look for function pattern with async, pub, unsafe, etc.
    const rustFnRegex = /\b(?:pub\s+)?(?:async\s+)?(?:unsafe\s+)?\s*fn\s+\w+\s*\([^)]*\)/;
    if (rustFnRegex.test(line)) {
        return true;
    }
    return false;
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
export async function decryptCodeBlock(encrypted, key) {
    console.log(`🔍 Decrypting: "${encrypted}"`);
    // Parse: IV:...|TAG:...|encrypted_data
    const parts = encrypted.split('|');
    console.log(`   Parts: ${JSON.stringify(parts)}`);
    console.log(`   Parts length: ${parts.length}`);
    if (parts.length < 3) {
        throw new Error(`Invalid encrypted format: expected at least 3 parts, got ${parts.length}. Full string: "${encrypted}"`);
    }
    const ivPart = parts[0];
    const tagPart = parts[1];
    const cipherText = parts.slice(2).join('|'); // In case cipherText itself contains '|'
    console.log(`   IV Part: "${ivPart}" (type: ${typeof ivPart})`);
    console.log(`   TAG Part: "${tagPart}" (type: ${typeof tagPart})`);
    console.log(`   Cipher Text: "${cipherText}" (type: ${typeof cipherText})`);
    if (ivPart === undefined) {
        throw new Error(`IV part is undefined! parts[0] = ${parts[0]}`);
    }
    if (tagPart === undefined) {
        throw new Error(`TAG part is undefined! parts[1] = ${parts[1]}`);
    }
    console.log(`   About to call replace on ivPart: "${ivPart}"`);
    console.log(`   About to call replace on tagPart: "${tagPart}"`);
    const iv = Buffer.from(ivPart.replace('IV:', ''), 'base64');
    const tag = Buffer.from(tagPart.replace('TAG:', ''), 'base64');
    console.log(`   IV: ${iv.length} bytes`);
    console.log(`   TAG: ${tag.length} bytes`);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(`   Decrypted: "${decrypted.substring(0, 50)}..."`);
    return decrypted;
}
//# sourceMappingURL=smartEncryption.js.map