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