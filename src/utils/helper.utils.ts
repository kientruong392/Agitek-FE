export function getFormData(formData: FormData) {
  const data = Object.fromEntries(formData) as Record<string, any>;

  Object.keys(data).forEach((key) => {
    if (!(data[key] instanceof File) && typeof data[key] === "string") {
      data[key] = data[key].trim();
    }
  });

  return data;
}

export function toFormData(values: Record<string, any>): FormData {
  const formData = new FormData();

  Object.keys(values).forEach((key) => {
    const value = values[key];

    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "string") {
      formData.append(key, value.trim());
    } 
    else if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } 
    else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } 
    else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export function getErrorMsg(message: string | undefined, t: any) {
  if (!message) return null;
  return t(message);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhoneNumber(number: string): boolean {
  return /([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/.test(number);
}