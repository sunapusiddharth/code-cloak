import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob'; // ← Use named import
import { decryptFileByPath } from '../utils/fileDecryptor.js';
export const decryptAllCommand = new Command('decrypt-all')
    .description('Decrypt all CodeCloak encrypted files in directory')
    .option('-d, --dir <path>', 'Directory to scan', '.')
    .option('-i, --include <pattern>', 'File glob pattern to include', '**/*.{js,ts,py,go}')
    .option('-x, --exclude <pattern>', 'Comma-separated files/dirs to exclude', 'node_modules,.git,README.md,LICENSE,dist,build')
    .action(async (options) => {
    const excludeList = options.exclude.split(',').map((p) => p.trim());
    const excludePattern = `{${excludeList.join(',')}}`;
    const files = await glob(path.join(options.dir, options.include), {
        ignore: excludePattern,
        nodir: true
    });
    let count = 0;
    for (const file of files) {
        let content;
        try {
            content = fs.readFileSync(file, 'utf8');
        }
        catch {
            continue;
        }
        if (!content.includes('// CODECLOAK'))
            continue;
        try {
            const decrypted = await decryptFileByPath(file);
            fs.writeFileSync(file, decrypted);
            console.log(`🔓 Decrypted: ${file}`);
            count++;
        }
        catch (err) {
            console.error(`❌ Failed to decrypt ${file}: ${err.message}`);
        }
    }
    console.log(`✅ Successfully decrypted ${count} files.`);
});
//# sourceMappingURL=decryptAll.js.map