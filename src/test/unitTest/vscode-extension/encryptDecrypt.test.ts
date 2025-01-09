import {
  decrypt,
  encrypt,
} from '../../../vscode-extension/utils/encryptDecrypt';

describe('Encryption and Decryption', () => {
  const testText = 'welcome....!';

  it('should encrypt text and return a valid encrypted format', () => {
    const encryptedText = encrypt(testText);
    const [iv, encrypted] = encryptedText.split(':');

    expect(iv).toHaveLength(32);

    expect(encrypted).toMatch(/^[a-f0-9]+$/);
  });

  it('should decrypt text and return the original value', () => {
    const encryptedText = encrypt(testText);
    const decryptedText = decrypt(encryptedText);

    expect(decryptedText).toBe(testText);
  });

  it('should throw error when attempting to decrypt invalid encrypted data', () => {
    expect(() => {
      decrypt('invalid:encrypted:data');
    }).toThrow();
  });

  it('should produce different encrypted texts each time', () => {
    const encryptedText1 = encrypt(testText);
    const encryptedText2 = encrypt(testText);

    expect(encryptedText1).not.toBe(encryptedText2);
  });

  it('should decrypt multiple times correctly', () => {
    const encryptedText = encrypt(testText);
    let decryptedText = decrypt(encryptedText);

    expect(decryptedText).toBe(testText);

    decryptedText = decrypt(encryptedText);
    expect(decryptedText).toBe(testText);
  });
});
