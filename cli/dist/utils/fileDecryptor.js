import * as crypto from 'crypto';
import { deriveGitHubKey } from '../crypto/githubKeyDeriver.js';
import * as fs from 'fs'; // ← Add this import
export async function decryptWholeFile(content, key) {
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
        throw new Error(`Decryption failed. Key mismatch or corrupted file. ${err.message}`);
    }
}
export async function decryptBlocks(content, key) {
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
export async function decryptFileByPath(filepath) {
    const content = fs.readFileSync(filepath, 'utf8'); // ← Use imported fs
    const key = await deriveGitHubKey(filepath);
    if (content.includes('// CODECLOAK v1.0')) {
        return await decryptWholeFile(content, key);
    }
    else if (content.includes('// [CODECLOAK:ENCRYPTED_BLOCK]')) {
        return await decryptBlocks(content, key);
    }
    else {
        throw new Error('Not a CodeCloak encrypted file');
    }
}
//# sourceMappingURL=fileDecryptor.js.map