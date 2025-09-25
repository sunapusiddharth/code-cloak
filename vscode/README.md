# CodeCloak 🔐

> Hide sensitive code in public repos. Decrypt only when you’re logged into GitHub.

![Demo](https://i.imgur.com/XXXXX.gif) ← Add later

## ✨ Features

- 🔐 Encrypt files or code blocks with one command
- 🔓 Auto-decrypt in VSCode when logged into GitHub
- 🖱️ Right-click → “Encrypt Selection” / “Decrypt All in Project”
- 🚫 Zero passwords — uses your GitHub identity
- 🧩 CI/CD Ready — works with GitHub Actions & PATs

## 📦 Install

```bash
npm install -g codecloak
# CodeCloak Security Model

## 🔐 Encryption

- Uses AES-256-GCM.
- Keys derived from: `HKDF(GitHub_Username + GitHub_Token_Hash + Filepath_Salt)`

## 🚫 What We Don’t Do

- Store passwords or keys.
- Send data to servers.
- Hide existence of encrypted content.

## ⚠️ Threat Model

- Safe against public repo viewers.
- Not safe against someone with access to your logged-in machine.

## 💡 Best Practices

- Log out of `gh` on shared machines.
- Use SSH key mode for extra security.
- Never commit decrypted files.