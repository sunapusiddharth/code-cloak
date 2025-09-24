import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);

export async function decryptWholeFile(content: string, key: Buffer): Promise<string> {
  const lines = content.split('\n');
  let iv: Buffer | null = null;
  let authTag: Buffer | null = null;
  let cipherText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('// IV: ')) {
      iv = Buffer.from(line.slice(7), 'base64');
    } else if (line.startsWith('// TAG: ')) {
      authTag = Buffer.from(line.slice(8), 'base64');
    } else if (!line.startsWith('// ') && line.trim() !== '') {
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
  } catch (err) {
    throw new Error(`Decryption failed. Are you logged into the same GitHub account used for encryption? ${err.message}`);
  }
}

export async function decryptBlocks(content: string, key: Buffer): Promise<string> {
  const lines = content.split('\n');
  let result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '// [CODECLOAK:ENCRYPTED_BLOCK]') {
      i++;
      if (i >= lines.length) break;
      const metaLine = lines[i];

      const match = metaLine.match(/IV:([^|]+)\|TAG:(.+)/);
      if (!match) {
        throw new Error(`Invalid metadata at line ${i}: ${metaLine}`);
      }

      const iv = Buffer.from(match[1], 'base64');
      const authTag = Buffer.from(match[2], 'base64');

      i++;
      if (i >= lines.length) break;
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
      } catch (err) {
        throw new Error(`Block decryption failed: ${err.message}`);
      }

      i++;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

export async function deriveGitHubKeyForVSCode(filepath: string): Promise<Buffer> {
  try {
    const token = (await execAsync('gh auth token')).stdout.trim();
    const user = (await execAsync('gh api user --jq .login')).stdout.trim();
    const salt = crypto.createHash('sha256').update(filepath).digest('hex').substring(0, 16);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const material = `${user}-${tokenHash}-${salt}`;
    return crypto.createHash('sha256').update(material).digest();
  } catch (err) {
    throw new Error(`Failed to derive key. Are you logged into GitHub? Run 'gh auth login'.\n${err.message}`);
  }
}