export const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Minimum 6 characters
  return password && password.length >= 6;
};

export const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

export const validateStudentId = (id) => {
  return id && id.trim().length > 0;
};

export const validateEmployeeId = (id) => {
  return id && id.trim().length > 0;
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone && phoneRegex.test(phone);
};

export const validateFaceDescriptor = (descriptor) => {
  return (
    Array.isArray(descriptor) &&
    descriptor.length === 128 &&
    descriptor.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
};

export const validateAttendanceRequest = (data) => {
  const errors = [];

  if (!validateFaceDescriptor(data.faceDescriptor)) {
    errors.push('Invalid face descriptor');
  }

  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    errors.push('Invalid confidence score');
  }

  return errors;
};
