import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  validateLogin,
} from './validateLogin';

describe('validateLogin', () => {
  it('should return no errors for valid inputs', () => {
    const errors = validateLogin('test@example.com', 'password123');
    expect(errors).toEqual([]);
  });

  it('should require email', () => {
    const errors = validateLogin('', 'password123');
    expect(errors).toEqual([
      { fieldId: 'email', message: 'Email is required' },
    ]);
  });

  it('should validate email format', () => {
    const errors = validateLogin('invalid-email', 'password123');
    expect(errors).toEqual([
      { fieldId: 'email', message: 'Email must be valid' },
    ]);
  });

  it('should require password', () => {
    const errors = validateLogin('test@example.com', '');
    expect(errors).toEqual([
      { fieldId: 'password', message: 'Password is required' },
    ]);
  });

  it('should validate password length', () => {
    const errors = validateLogin('test@example.com', 'short');
    expect(errors).toEqual([
      { fieldId: 'password', message: 'Password must be at least 8 characters' },
    ]);
  });

  it('should collect multiple validation errors', () => {
    const errors = validateLogin('', 'short');
    expect(errors).toEqual([
      { fieldId: 'email', message: 'Email is required' },
      { fieldId: 'password', message: 'Password must be at least 8 characters' },
    ]);
  });

  describe('length ceilings', () => {
    it('exports MAX_EMAIL_LENGTH as 254 per RFC 5321', () => {
      expect(MAX_EMAIL_LENGTH).toBe(254);
    });

    it('exports MAX_PASSWORD_LENGTH as 128', () => {
      expect(MAX_PASSWORD_LENGTH).toBe(128);
    });

    it('trims surrounding whitespace from the email before validating', () => {
      const errors = validateLogin('  test@example.com  ', 'password123');
      expect(errors).toEqual([]);
    });

    it('treats a whitespace-only email as empty after trimming', () => {
      const errors = validateLogin('     ', 'password123');
      expect(errors).toEqual([
        { fieldId: 'email', message: 'Email is required' },
      ]);
    });

    it('treats an over-length trimmed email as over-length', () => {
      const longEmail = `${'a'.repeat(MAX_EMAIL_LENGTH - '@example.com'.length + 5)}@example.com`;
      expect(longEmail.length).toBeGreaterThan(MAX_EMAIL_LENGTH);
      const errors = validateLogin(longEmail, 'password123');
      expect(errors).toEqual([
        {
          fieldId: 'email',
          message: `Email must be no more than ${MAX_EMAIL_LENGTH} characters`,
        },
      ]);
    });

    it('counts length against the trimmed email, not the raw input', () => {
      // Padding only affects what we strip — the inner content is the over-length payload.
      const paddedLongEmail = `   ${'a'.repeat(MAX_EMAIL_LENGTH - '@example.com'.length + 5)}@example.com   `;
      const errors = validateLogin(paddedLongEmail, 'password123');
      expect(errors).toEqual([
        {
          fieldId: 'email',
          message: `Email must be no more than ${MAX_EMAIL_LENGTH} characters`,
        },
      ]);
    });

    it('accepts an email whose trimmed length equals the ceiling', () => {
      const localPart = 'a'.repeat(MAX_EMAIL_LENGTH - '@example.com'.length);
      const email = `${localPart}@example.com`;
      expect(email.length).toBe(MAX_EMAIL_LENGTH);
      const errors = validateLogin(email, 'password123');
      expect(errors).toEqual([]);
    });

    it('rejects a password whose length exceeds MAX_PASSWORD_LENGTH', () => {
      const longPassword = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);
      const errors = validateLogin('test@example.com', longPassword);
      expect(errors).toEqual([
        {
          fieldId: 'password',
          message: `Password must be no more than ${MAX_PASSWORD_LENGTH} characters`,
        },
      ]);
    });

    it('accepts a password whose length equals MAX_PASSWORD_LENGTH', () => {
      const exactPassword = 'a'.repeat(MAX_PASSWORD_LENGTH);
      const errors = validateLogin('test@example.com', exactPassword);
      expect(errors).toEqual([]);
    });

    it('returns the over-length email error in preference to the format error', () => {
      // Long email that ALSO lacks '@' — length check fires first.
      const longEmailNoAt = 'a'.repeat(MAX_EMAIL_LENGTH + 10);
      const errors = validateLogin(longEmailNoAt, 'password123');
      expect(errors).toEqual([
        {
          fieldId: 'email',
          message: `Email must be no more than ${MAX_EMAIL_LENGTH} characters`,
        },
      ]);
    });

    it('surfaces a per-field error for both fields when both are over-length', () => {
      const longEmail = `${'a'.repeat(MAX_EMAIL_LENGTH - '@example.com'.length + 5)}@example.com`;
      const longPassword = 'a'.repeat(MAX_PASSWORD_LENGTH + 5);
      const errors = validateLogin(longEmail, longPassword);
      expect(errors).toEqual([
        {
          fieldId: 'email',
          message: `Email must be no more than ${MAX_EMAIL_LENGTH} characters`,
        },
        {
          fieldId: 'password',
          message: `Password must be no more than ${MAX_PASSWORD_LENGTH} characters`,
        },
      ]);
    });
  });
});
