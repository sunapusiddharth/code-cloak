import * as crypto from 'crypto';
import { execa } from 'execa'; // ← Use ES import instead of require
export async function deriveGitHubKey(filepath) {
    try {
        const { stdout: user } = await execa('gh', ['api', 'user', '--jq', '.login + "-" + (.id | tostring)']);
        const { stdout: token } = await execa('gh', ['auth', 'token']);
        const salt = crypto.createHash('sha256').update(filepath).digest('hex').substring(0, 16);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const material = `${user}-${tokenHash}-${salt}`;
        return crypto.createHash('sha256').update(material).digest();
    }
    catch (err) {
        throw new Error(`Failed to derive key. Are you logged into GitHub? Run 'gh auth login'.\n${err.message}`);
    }
}
//# sourceMappingURL=githubKeyDeriver.js.map