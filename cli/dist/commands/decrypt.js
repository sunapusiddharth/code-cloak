import { Command } from 'commander';
import * as fs from 'fs'; // ← ADD THIS IMPORT
import { decryptFileByPath } from '../utils/fileDecryptor.js'; // ← ADD .js
export const decryptCommand = new Command('decrypt')
    .description('Decrypt file using GitHub identity')
    .argument('<filepath>', 'Path to encrypted file')
    .option('-f, --force', 'Overwrite file with decrypted content')
    .action(async (filepath, options) => {
    try {
        const decrypted = await decryptFileByPath(filepath);
        if (options.force) {
            fs.writeFileSync(filepath, decrypted); // ← USE IMPORTED fs
            console.log(`✅ Decrypted and saved to ${filepath}`);
        }
        else {
            console.log('\n--- DECRYPTED CONTENT ---\n');
            console.log(decrypted);
        }
    }
    catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
    }
});
//# sourceMappingURL=decrypt.js.map