/**
 * Validation utilities for GigShield onboarding flow
 */

export function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validateFullName(name) {
  return name.trim().length >= 2;
}

export function validateAge(age) {
  const n = parseInt(age, 10);
  return !isNaN(n) && n >= 18 && n <= 65;
}

export function validateCity(city) {
  return city.trim().length >= 2;
}

export function validateRiderId(id) {
  return id.trim().length >= 3;
}

