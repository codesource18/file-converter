import { describe, it, expect } from 'vitest';
import { detectFormatFromBytes } from '@fileconverter/file-detection';

describe('Security & Edge Cases Tests', () => {
  it('detects actual PNG format even when disguised with .pdf fake extension', () => {
    // PNG bytes named 'fake.pdf'
    const fakePdfBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const detected = detectFormatFromBytes(fakePdfBytes, 'fake.pdf');
    expect(detected).toBe('PNG');
  });

  it('detects actual PDF format even when disguised with .jpg fake extension', () => {
    const fakeJpgBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]);
    const detected = detectFormatFromBytes(fakeJpgBytes, 'fake.jpg');
    expect(detected).toBe('PDF');
  });

  it('handles empty / zero byte files without crashing', () => {
    const emptyBytes = new Uint8Array([]);
    const detected = detectFormatFromBytes(emptyBytes, 'empty.dat');
    expect(detected).toBe('unsupported');
  });

  it('handles corrupted random bytes safely', () => {
    const randomBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC]);
    const detected = detectFormatFromBytes(randomBytes, 'unknown.bin');
    expect(detected).toBe('unsupported');
  });
});
