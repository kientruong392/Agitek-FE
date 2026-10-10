
export function getErrorMsg(message: string | undefined, t: (key: string) => string) {
  if (!message) return null;
  try {
    return t(message);
  } catch {
    return message;
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhoneNumber(number: string): boolean {
  return /([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/.test(number);
}