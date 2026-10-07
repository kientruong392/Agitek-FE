export function getFormData(formData: FormData): Record<string, string | File> {
  const data = Object.fromEntries(formData) as Record<string, string | File>;

  Object.keys(data).forEach((key) => {
    if (!(data[key] instanceof File) && typeof data[key] === "string") {
      data[key] = data[key].trim();
    }
  });

  return data;
}

export function toFormData(
  values: Record<string, unknown>, 
  parentKey = "", 
  formData = new FormData()
): FormData {
  Object.keys(values).forEach((key) => {
    const value = values[key];
    
    const formKey = parentKey ? `\({parentKey}.\){key}` : key;

    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(formKey, value);
    } 
    else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`\({formKey}[\){index}]`, String(item));
      });
    } 
    else if (typeof value === "object" && value !== null) {
      toFormData(value as Record<string, unknown>, formKey, formData);
    } 
    else if (typeof value === "string") {
      formData.append(formKey, value.trim());
    } 
    else {
      formData.append(formKey, String(value));
    }
  });

  return formData;
}

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