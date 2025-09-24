import { exec } from 'child_process';
import { promisify } from 'util';
export const execAsync = promisify(exec);

export async function checkGitHubLogin(): Promise<{ loggedIn: boolean; user?: string }> {
  try {
    const { stdout } = await execAsync('gh auth status --show-token');
    if (stdout.includes('Logged in to github.com')) {
      const { stdout: user } = await execAsync('gh api user --jq .login');
      return { loggedIn: true, user: user.trim() };
    }
  } catch {}
  return { loggedIn: false };
}

export async function getGitHubToken(): Promise<string> {
  const { stdout } = await execAsync('gh auth token');
  return stdout.trim();
}