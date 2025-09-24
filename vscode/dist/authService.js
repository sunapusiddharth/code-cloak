"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execAsync = void 0;
exports.checkGitHubLogin = checkGitHubLogin;
exports.getGitHubToken = getGitHubToken;
const child_process_1 = require("child_process");
const util_1 = require("util");
exports.execAsync = (0, util_1.promisify)(child_process_1.exec);
async function checkGitHubLogin() {
    try {
        const { stdout } = await (0, exports.execAsync)('gh auth status --show-token');
        if (stdout.includes('Logged in to github.com')) {
            const { stdout: user } = await (0, exports.execAsync)('gh api user --jq .login');
            return { loggedIn: true, user: user.trim() };
        }
    }
    catch { }
    return { loggedIn: false };
}
async function getGitHubToken() {
    const { stdout } = await (0, exports.execAsync)('gh auth token');
    return stdout.trim();
}
//# sourceMappingURL=authService.js.map