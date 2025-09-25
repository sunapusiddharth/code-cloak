# CodeCloak — Selective Code Encryption for GitHub

Encrypt sensitive parts of your codebase using keys derived from your GitHub identity. Decrypt only when you need to, keeping your secrets safe even in public repositories.

---

## Contents

- Overview  
- Features  
- Installation  
- Usage Examples  
- CLI Commands  
- How It Works  
- Supported Languages  
- Security  
- Advanced Usage  
- Development  
- Contributing  
- License  
- Contact  

---

## Overview

CodeCloak lets you encrypt individual functions, code blocks, or entire files without managing external keys. Everything is derived from your GitHub token and file path, so only you (or anyone with your token) can decrypt the protected sections.

---

## Features

- GitHub-based key derivation—no additional key storage  
- Selective encryption at function or block level  
- Automatic detection of function bodies across popular languages  
- Encrypt or decrypt all files in a directory with a single command  
- Command-line interface and VS Code extension integration  
- Preview mode to inspect decrypted content without modifying files  

---

## Installation

### CLI

```bash
npm install -g codecloak
```

### VS Code Extension

1. Open VS Code  
2. Go to Extensions and search for “CodeCloak”  
3. Click Install  

---

## Usage Examples

Encrypt an entire file:  
```bash
codecloak encrypt path/to/file.js
```

Decrypt with overwrite:  
```bash
codecloak decrypt path/to/file.js --force
```

Encrypt only function bodies:  
```bash
codecloak smart-encrypt src/server.ts
```

Decrypt all function bodies in a repo:  
```bash
codecloak smart-decrypt-all --dir .
```

---

## CLI Commands

| Command                             | Description                                       |
|-------------------------------------|---------------------------------------------------|
| `codecloak encrypt <file>`          | Encrypt the entire file                           |
| `codecloak decrypt <file>`          | Decrypt the entire file (preview mode)            |
| `codecloak decrypt <file> --force`  | Decrypt and overwrite the original file           |
| `codecloak encrypt <file> -b`       | Encrypt only marked blocks (`// CODECLOAK:ENCRYPT`) |
| `codecloak smart-encrypt <file>`    | Encrypt only function bodies                      |
| `codecloak smart-decrypt <file>`    | Decrypt only function bodies                      |
| `codecloak smart-encrypt-all`       | Encrypt all function bodies in a directory        |
| `codecloak smart-decrypt-all`       | Decrypt all function bodies in a directory        |

---

## How It Works

1. Derive an AES-256-GCM key from your GitHub token, username, and file path.  
2. Encrypt selected sections and embed the IV and authentication tag in comments.  
3. Decryption reverses the process, using the same key derivation to verify integrity.  

---

## Supported Languages

- JavaScript and TypeScript  
- Python  
- Go  
- Rust  
- Java  
- C and C++  

---

## Security

- No remote key storage—everything remains local.  
- AES-256-GCM provides authenticated encryption.  
- Unique key per file prevents cross-file attacks.  

---

## Advanced Usage

Include or exclude specific files or patterns:  
```bash
codecloak smart-encrypt-all --include "**/*.ts" --exclude "node_modules,.git"
```

Preview decrypted content without saving:  
```bash
codecloak decrypt secret.js
```

Force overwrite decrypted content:  
```bash
codecloak decrypt secret.js --force
```

---

## Development

Clone the repository and build:

```bash
git clone https://github.com/your-repo/codecloak.git
cd codecloak/cli
npm install
npm run build
npm install -g .

cd ../vscode
npm install
npm run compile
```

Run the VS Code extension in development mode:

- Open the `vscode` folder in VS Code  
- Press F5 to launch an Extension Development Host  

---

## Contributing

Contributions are welcome. Please read our CONTRIBUTING.md for guidelines on submitting issues and pull requests.

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or feedback, open an issue on GitHub or email us at your-email@example.com.