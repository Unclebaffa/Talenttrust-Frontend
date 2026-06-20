import { validateLogin } from './validateLogin';

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
});
