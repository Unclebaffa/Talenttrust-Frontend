/**
 * Represents a validation error for a specific form field.
 */
export interface ValidationError {
  /** The unique identifier of the form field that has the error. */
  fieldId: string;
  /** The localized/readable error message string. */
  message: string;
}

/**
 * Validates the email and password fields for the login form.
 * 
 * Rules:
 * - Email is required and must contain '@'
 * - Password is required and must be at least 8 characters
 * 
 * @param email - The email address string to validate.
 * @param password - The password string to validate.
 * @returns An array of validation errors, each containing the fieldId and the corresponding error message.
 *          Returns an empty array if all validations pass.
 */
export function validateLogin(email: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email) {
    errors.push({ fieldId: 'email', message: 'Email is required' });
  } else if (!email.includes('@')) {
    errors.push({ fieldId: 'email', message: 'Email must be valid' });
  }

  if (!password) {
    errors.push({ fieldId: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ fieldId: 'password', message: 'Password must be at least 8 characters' });
  }

  return errors;
}
