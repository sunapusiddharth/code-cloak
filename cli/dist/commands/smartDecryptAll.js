import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { decryptFunctionsInFile } from '../utils/smartEncryption.js';
export const smartDecryptAllCommand = new Command('smart-decrypt-all')
    .description('Decrypt functions in all supported files in directory')
    .option('-d, --dir <path>', 'Directory to scan', '.')
    .option('-i, --include <pattern>', 'File glob pattern to include', '**/*.{js,ts,py,go,java,c,cpp,rs}')
    .option('-x, --exclude <pattern>', 'Comma-separated files/dirs to exclude', 'node_modules,.git,README.md,LICENSE,dist,build,*.min.js')
    .action(async (options) => {
    const excludeList = options.exclude.split(',').map(p => p.trim());
    const excludePattern = `{${excludeList.join(',')}}`;
    const files = await glob(path.join(options.dir, options.include), {
        ignore: excludePattern,
        nodir: true
    });
    let decryptedCount = 0;
    let skippedCount = 0;
    console.log(`🔍 Scanning directory: ${options.dir}`);
    console.log(`📋 Include pattern: ${options.include}`);
    console.log(`🚫 Exclude pattern: ${options.exclude}`);
    console.log(`\n📁 Found ${files.length} files to process...\n`);
    for (const file of files) {
        const ext = path.extname(file).slice(1).toLowerCase();
        if (!isSupportedLanguage(ext)) {
            console.log(`⚠️  Skipping unsupported: ${file} (.${ext})`);
            console.log(`   Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
            skippedCount++;
            continue;
        }
        try {
            const originalContent = fs.readFileSync(file, 'utf8');
            const decryptedContent = await decryptFunctionsInFile(originalContent, ext, file);
            if (decryptedContent !== originalContent) {
                fs.writeFileSync(file, decryptedContent);
                console.log(`✅ Decrypted functions in: ${file}`);
                decryptedCount++;
            }
            else {
                console.log(`ℹ️  No encrypted functions found: ${file}`);
            }
        }
        catch (err) {
            console.error(`❌ Failed to process ${file}: ${err.message}`);
        }
    }
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Decrypted: ${decryptedCount} files`);
    console.log(`   ⚠️  Skipped: ${skippedCount} files`);
    console.log(`   📁 Total processed: ${files.length} files`);
});
// Same language support mapping
const SUPPORTED_LANGUAGES = {
    js: 'JavaScript',
    ts: 'TypeScript',
    py: 'Python',
    go: 'Go',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    rs: 'Rust'
};
function isSupportedLanguage(ext) {
    return ext in SUPPORTED_LANGUAGES;
}
//# sourceMappingURL=smartDecryptAll.js.map