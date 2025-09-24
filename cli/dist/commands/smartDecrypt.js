import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { decryptFunctionsInFile } from '../utils/smartEncryption.js';
// Extension to language mapping (same as smartEncrypt.ts)
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
    rs: 'rust', // ← Map .rs to rust
    rust: 'rust'
};
// Language display names
const SUPPORTED_LANGUAGES = {
    js: 'JavaScript',
    ts: 'TypeScript',
    py: 'Python',
    go: 'Go',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    rust: 'Rust' // ← Use 'rust' not 'rs'
};
export const smartDecryptCommand = new Command('smart-decrypt')
    .description('Decrypt functions in a supported programming language file')
    .argument('<filepath>', 'Path to file')
    .action(async (filepath) => {
    const ext = path.extname(filepath).slice(1).toLowerCase();
    // Map extension to language (like in smartEncrypt)
    const language = EXTENSION_MAP[ext];
    if (!language || !SUPPORTED_LANGUAGES[language]) {
        console.log(`❌ Unsupported file type: .${ext}`);
        console.log(`📋 Supported languages: ${Object.keys(EXTENSION_MAP).filter(ext => EXTENSION_MAP[ext]).join(', ')}`);
        console.log(`💡 Use 'codecloak decrypt' for file-level decryption`);
        return;
    }
    try {
        const originalContent = fs.readFileSync(filepath, 'utf8');
        // Pass 'ext' (rs) instead of 'language' (rust) to decryptFunctionsInFile
        const decryptedContent = await decryptFunctionsInFile(originalContent, ext, filepath); // ← PASS 'ext' NOT 'language'
        if (decryptedContent !== originalContent) {
            fs.writeFileSync(filepath, decryptedContent);
            console.log(`✅ Functions decrypted in ${filepath}`);
        }
        else {
            console.log(`ℹ️  No encrypted functions found in ${filepath}`);
            console.log(`💡 File may not contain CodeCloak encrypted functions`);
        }
    }
    catch (err) {
        console.error(`❌ Failed to decrypt functions in ${filepath}: ${err.message}`);
        process.exit(1);
    }
});
function isSupportedLanguage(ext) {
    const language = EXTENSION_MAP[ext];
    return language in SUPPORTED_LANGUAGES;
}
//# sourceMappingURL=smartDecrypt.js.map