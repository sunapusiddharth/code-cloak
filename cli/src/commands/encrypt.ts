import { Command } from 'commander';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { deriveGitHubKey } from '../crypto/githubKeyDeriver.js';  // ← ADD .js extension

export const encryptCommand = new Command('encrypt')
  .description('Encrypt a file or code blocks using GitHub identity')
  .argument('<filepath>', 'Path to file')
  .option('-b, --block', 'Encrypt only blocks marked with // CODECLOAK:ENCRYPT')
  .action(async (filepath, options) => {
    const content = fs.readFileSync(filepath, 'utf8');
    const key = await deriveGitHubKey(filepath);

    let encryptedContent: string;

    if (options.block) {
      encryptedContent = await encryptBlocks(content, key, filepath);
    } else {
      encryptedContent = await encryptFile(content, key, filepath);
    }

    fs.writeFileSync(filepath, encryptedContent);
    console.log(`✅ Encrypted ${filepath} using GitHub identity.`);
    console.log(`💡 Tip: To decrypt elsewhere, run 'gh auth login' then 'codecloak decrypt ${filepath}'`);
  });

async function encryptFile(content: string, key: Buffer, filepath: string): Promise<string> {
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

async function encryptBlocks(content: string, key: Buffer, filepath: string): Promise<string> {
  const lines = content.split('\n');
  let inBlock = false;
  let blockLines: string[] = [];
  let result: string[] = [];

  for (let line of lines) {
    if (line.includes('// CODECLOAK:ENCRYPT')) {
      inBlock = true;
      blockLines = [];
      result.push(line);
      continue;
    }
    if (line.includes('// CODECLOAK:END')) {
      inBlock = false;
      const blockContent = blockLines.join('\n');
      const encryptedBlock = await encryptBlock(blockContent, key, filepath);
      result.push(encryptedBlock);
      result.push(line);
      continue;
    }
    if (inBlock) {
      blockLines.push(line);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

async function encryptBlock(content: string, key: Buffer, filepath: string): Promise<string> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return `// [CODECLOAK:ENCRYPTED_BLOCK]
// IV:${iv.toString('base64')}|TAG:${authTag}
${encrypted}
// [CODECLOAK:END_ENCRYPTED]`;
}