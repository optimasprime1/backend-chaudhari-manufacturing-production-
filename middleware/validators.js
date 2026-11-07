// Simple, dependency-free request validators.

function isNonEmptyString(v, minLen = 1) {
  return typeof v === 'string' && v.trim().length >= minLen;
}

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v) {
  return typeof v === 'string' && /^[0-9+\-\s()]{7,20}$/.test(v.trim());
}

// Validates a new enquiry payload. Returns an array of error messages
// (empty array = valid).
function validateEnquiry(body) {
  const errors = [];
  if (!isNonEmptyString(body.fullName, 2)) errors.push('Full name is required (min 2 characters).');
  if (!isValidEmail(body.email)) errors.push('A valid email address is required.');
  if (!isValidPhone(body.mobileNumber)) errors.push('A valid mobile number is required.');
  if (!isNonEmptyString(body.selectedProduct, 1)) errors.push('Please select a product.');
  if (!isNonEmptyString(body.message, 5)) errors.push('Message must be at least 5 characters.');
  return errors;
}

// Validates a new/updated product payload.
function validateProduct(body, { partial = false } = {}) {
  const errors = [];
  const required = ['name', 'category', 'description', 'image'];
  required.forEach(field => {
    if (!partial || body[field] !== undefined) {
      if (!isNonEmptyString(body[field], 1)) errors.push(`${field} is required.`);
    }
  });
  return errors;
}

function validateAdminProduct(body, { partial = false } = {}) {
  const errors = [];
  const required = ['name', 'model', 'categoryId', 'average', 'motor', 'operation', 'bodyType'];
  required.forEach(field => {
    if (!partial || body[field] !== undefined) {
      if (!isNonEmptyString(body[field], 1)) errors.push(`${field} is required.`);
    }
  });
  if (body.operation !== undefined && !['Semiautomatic', 'Automatic', 'Manual'].includes(body.operation)) {
    errors.push('operation must be Semiautomatic, Automatic, or Manual.');
  }
  return errors;
}

function validateCategory(body, { partial = false } = {}) {
  const errors = [];
  for (const field of ['name', 'categoryId']) {
    if ((!partial || body[field] !== undefined) && !isNonEmptyString(body[field])) {
      errors.push(`${field} is required.`);
    }
  }
  if (body.categoryId !== undefined && !/^[a-z0-9][a-z0-9_-]{1,49}$/i.test(body.categoryId.trim())) {
    errors.push('categoryId must be 2-50 letters, numbers, hyphens, or underscores.');
  }
  return errors;
}

module.exports = { isNonEmptyString, isValidEmail, isValidPhone, validateEnquiry, validateProduct, validateAdminProduct, validateCategory };
