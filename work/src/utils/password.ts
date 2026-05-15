/**
 * Validates password complexity per FR-003.
 * Password must be at least 8 characters, contain at least one uppercase letter,
 * one digit, and one special character.
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one digit";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character (e.g. @, #, !, $)";
  }
  return null;
}
