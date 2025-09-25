# 🛡️ CodeCloak — Selective Code Encryption for GitHub

> **Encrypt sensitive code blocks using your GitHub identity. Decrypt only when you need to.**

---

## ✨ Features

- 🔐 **GitHub Authenticated**: Uses your `gh` token to derive encryption keys
- 🧩 **Selective Encryption**: Encrypt only functions, blocks, or entire files
- 🚀 **Multi-Language Support**: JavaScript, TypeScript, Python, Go, Rust, Java, C++, C
- 💡 **Smart Encryption**: Automatically detects and encrypts function bodies
- 📁 **Repo-Wide Operations**: Encrypt/decrypt all files in a directory
- 🎯 **VSCode Integration**: Right-click context menu + Command Palette support
- 🔄 **Preview Mode**: See decrypted content without overwriting files

---

## 🚀 Quick Start

### 1. Install CLI
```bash
npm install -g codecloak
```

### 2. Login to GitHub
```bash
gh auth login
```

### 3. Encrypt a file
```bash
codecloak encrypt secret.js
```

### 4. Decrypt a file
```bash
codecloak decrypt secret.js --force
```

### 5. Smart Encrypt (function-level)
```bash
codecloak smart-encrypt server.ts
```

### 6. Smart Decrypt (function-level)
```bash
codecloak smart-decrypt server.ts
```

### 7. Encrypt All Files in Repo
```bash
codecloak smart-encrypt-all --dir .
```

### 8. Decrypt All Files in Repo
```bash
codecloak smart-decrypt-all --dir .
```

---

## 🧩 CLI Commands

| Command | Description |
|---------|-------------|
| `codecloak encrypt <file>` | Encrypt entire file |
| `codecloak decrypt <file>` | Decrypt entire file |
| `codecloak decrypt <file> --force` | Overwrite file with decrypted content |
| `codecloak encrypt <file> -b` | Encrypt only `// CODECLOAK:ENCRYPT` blocks |
| `codecloak smart-encrypt <file>` | Encrypt only function bodies |
| `codecloak smart-decrypt <file>` | Decrypt only function bodies |
| `codecloak smart-encrypt-all` | Encrypt all function bodies in repo |
| `codecloak smart-decrypt-all` | Decrypt all function bodies in repo |

---

## 🧠 How It Works

1. **Key Derivation**: Uses your GitHub username + token + file path to generate a unique key
2. **AES-256-GCM**: Industry-standard authenticated encryption
3. **Metadata**: Stores IV and TAG in comments for safe decryption
4. **Language-Aware**: Understands syntax of different programming languages
5. **Non-Destructive**: Original code is preserved as comments when encrypted

---

## 🖥️ VSCode Extension

Install the VSCode extension for seamless integration:

### Installation
1. Open VSCode → Extensions → Search "CodeCloak"
2. Click "Install"

### Features
- Right-click context menu for encryption/decryption
- Command Palette (`Ctrl+Shift+P`) commands
- Gutter icons for encrypted blocks
- Smart function-level encryption/decryption

---

## 🌐 Supported Languages

- JavaScript / TypeScript
- Python
- Go
- Rust
- Java
- C / C++

---

## 🔐 Security

- **No remote storage**: Keys are derived locally from your GitHub identity
- **No central server**: Everything happens on your machine
- **AES-256-GCM**: Military-grade encryption with authentication
- **Key derivation**: Unique key per file based on your GitHub identity

---

## 📦 Advanced Usage

### Include/Exclude Patterns
```bash
codecloak smart-encrypt-all --include "**/*.{js,ts,py}" --exclude "node_modules,.git"
```

### Preview Mode (Don't overwrite)
```bash
codecloak decrypt secret.js  # Shows decrypted content without saving
```

### Force Overwrite
```bash
codecloak decrypt secret.js --force  # Overwrites original file
```

---

## 🛠️ Development

### Clone & Build
```bash
git clone https://github.com/your-repo/codecloak.git
cd codecloak

# Build CLI
cd cli
npm install
npm run build
npm install -g .

# Build VSCode Extension
cd ../vscode
npm install
npm run compile
```

### Test Locally
```bash
# Run VSCode Extension Development Host
cd vscode
npm run compile
# Press F5 in VSCode to launch development host
```

---

## 📜 License

MIT © 2024 Your Name

---

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📬 Contact

For questions or feedback, open an issue or email us at [your-email@example.com]

---

**Protect your secrets. Share your code.**  
*CodeCloak — Because not all code should be public.*