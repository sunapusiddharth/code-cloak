import { decryptWholeFile, decryptBlocks } from '../utils/fileDecryptor.js';
// Mock crypto
jest.mock('crypto', () => ({
    createDecipheriv: jest.fn().mockReturnThis(),
    setAuthTag: jest.fn(),
    update: jest.fn().mockReturnValue('decrypted '),
    final: jest.fn().mockReturnValue('content')
}));
describe('decryptUtils', () => {
    const mockKey = Buffer.alloc(32);
    test('decryptWholeFile parses metadata and decrypts', async () => {
        const content = `// CODECLOAK v1.0
// IV: aW5pdFZlY3Rvcg==
// TAG: YXV0aFRhZw==
// PATH: test.js

cipherTextBase64`;
        const result = await decryptWholeFile(content, mockKey);
        expect(result).toBe('decrypted content');
    });
    test('decryptBlocks decrypts inline block', async () => {
        const content = `public line
// [CODECLOAK:ENCRYPTED_BLOCK]
// IV:aW5pdA==|TAG:dGFn
cipherText
// [CODECLOAK:END_ENCRYPTED]
public line`;
        const result = await decryptBlocks(content, mockKey);
        expect(result).toContain('decrypted content');
    });
});
//# sourceMappingURL=decryptUtils.test.js.map