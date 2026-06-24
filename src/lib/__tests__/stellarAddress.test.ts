import { isValidStellarAddress, normalizeStellarAddress } from '../stellarAddress';

describe('stellarAddress helpers', () => {
  it('accepts well-formed Stellar public keys', () => {
    const validAddress = 'GBAJ7XQ2WQ4A4N5S6M7Q8R9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8';

    expect(isValidStellarAddress(validAddress)).toBe(true);
    expect(isValidStellarAddress(validAddress.toLowerCase())).toBe(true);
    expect(normalizeStellarAddress(validAddress.toLowerCase())).toBe(validAddress.toUpperCase());
  });

  it('rejects wrong prefixes, bad lengths, and invalid characters', () => {
    expect(isValidStellarAddress('')).toBe(false);
    expect(isValidStellarAddress('ABC1234567890')).toBe(false);
    expect(isValidStellarAddress('GBAJ7XQ2WQ4A4N5S6M7Q8R9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7')).toBe(false);
    expect(isValidStellarAddress('GBAJ7XQ2WQ4A4N5S6M7Q8R9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8!')).toBe(false);
    expect(isValidStellarAddress('GBAJ7XQ2WQ4A4N5S6M7Q8R9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8O')).toBe(false);
  });

  it('normalizes whitespace and case without throwing for invalid input', () => {
    expect(normalizeStellarAddress('  gbanh4n6j5q6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8  ')).toBe('GBANH4N6J5Q6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8');
    expect(normalizeStellarAddress('')).toBe('');
    expect(normalizeStellarAddress(undefined as unknown as string)).toBe('');
    expect(isValidStellarAddress('   ')).toBe(false);
  });

  it('keeps the exact 56-character boundary behavior explicit', () => {
    const exactLength = 'G'.padEnd(56, 'A');
    const tooLong = `${exactLength}B`;

    expect(exactLength).toHaveLength(56);
    expect(isValidStellarAddress(exactLength)).toBe(true);
    expect(isValidStellarAddress(tooLong)).toBe(false);
  });
});
