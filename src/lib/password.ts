export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 6) return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  if (password.length > 128) return { isValid: false, error: 'La contraseña no puede tener más de 128 caracteres' };
  return { isValid: true };
}
