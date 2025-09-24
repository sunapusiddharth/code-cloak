"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptWholeFile = decryptWholeFile;
exports.decryptBlocks = decryptBlocks;
exports.deriveGitHubKeyForVSCode = deriveGitHubKeyForVSCode;
const crypto = __importStar(require("crypto"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function decryptWholeFile(content, key) {
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
        throw new Error(`Decryption failed. Are you logged into the same GitHub account used for encryption? ${err.message}`);
    }
}
async function decryptBlocks(content, key) {
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
async function deriveGitHubKeyForVSCode(filepath) {
    try {
        const token = (await execAsync('gh auth token')).stdout.trim();
        const user = (await execAsync('gh api user --jq .login')).stdout.trim();
        const salt = crypto.createHash('sha256').update(filepath).digest('hex').substring(0, 16);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const material = `${user}-${tokenHash}-${salt}`;
        return crypto.createHash('sha256').update(material).digest();
    }
    catch (err) {
        throw new Error(`Failed to derive key. Are you logged into GitHub? Run 'gh auth login'.\n${err.message}`);
    }
}
//# sourceMappingURL=decryptUtils.js.map