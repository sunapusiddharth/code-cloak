import { Command } from 'commander';
import { encryptCommand } from './commands/encrypt.js';
import { decryptCommand } from './commands/decrypt.js';
import { decryptAllCommand } from './commands/decryptAll.js';
import { smartEncryptCommand } from './commands/smartEncrypt.js';
import { smartDecryptCommand } from './commands/smartDecrypt.js';  // ← ADD
import { smartEncryptAllCommand } from './commands/smartEncryptAll.js';
import { smartDecryptAllCommand } from './commands/smartDecryptAll.js';

const program = new Command();

program
  .name('codecloak')
  .description('Selective code encryption using GitHub identity')
  .version('1.0.0');

program.addCommand(encryptCommand);
program.addCommand(decryptCommand);
program.addCommand(decryptAllCommand);
program.addCommand(smartEncryptCommand);
program.addCommand(smartDecryptCommand);  // ← ADD
program.addCommand(smartEncryptAllCommand);
program.addCommand(smartDecryptAllCommand);

program.parse();