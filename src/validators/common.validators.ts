// ═══════════════════════════════════════════════════════════════
// COMMON VALIDATORS
// Validadores reusables con express-validator
// ═══════════════════════════════════════════════════════════════

import { body, param, query, ValidationChain } from 'express-validator';

// ─────────────────────────────────────────────────────────────
// Email Validator
// ─────────────────────────────────────────────────────────────

export const validateEmail = (field: string = 'email'): ValidationChain => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .toLowerCase();
};

// ─────────────────────────────────────────────────────────────
// Password Validator
// ─────────────────────────────────────────────────────────────

export const validatePassword = (field: string = 'password'): ValidationChain => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener mayúsculas, minúsculas y números');
};

// ─────────────────────────────────────────────────────────────
// Phone Validator
// ─────────────────────────────────────────────────────────────

export const validatePhone = (field: string = 'telefono'): ValidationChain => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Formato de teléfono inválido (usar formato internacional)');
};

// ─────────────────────────────────────────────────────────────
// MongoDB ObjectId Validator
// ─────────────────────────────────────────────────────────────

export const validateObjectId = (field: string = 'id'): ValidationChain => {
  return param(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} es requerido`)
    .isMongoId()
    .withMessage(`${field} inválido`);
};

// ─────────────────────────────────────────────────────────────
// Prisma CUID Validator
// ─────────────────────────────────────────────────────────────

export const validateCuid = (field: string = 'id'): ValidationChain => {
  return param(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} es requerido`)
    .matches(/^c[a-z0-9]{24}$/)
    .withMessage(`${field} inválido (formato CUID esperado)`);
};

// ─────────────────────────────────────────────────────────────
// String Validator
// ─────────────────────────────────────────────────────────────

export const validateString = (
  field: string,
  minLength: number = 1,
  maxLength: number = 255
): ValidationChain => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} es requerido`)
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} debe tener entre ${minLength} y ${maxLength} caracteres`)
    .escape(); // Escapa HTML
};

// ─────────────────────────────────────────────────────────────
// Number Validator
// ─────────────────────────────────────────────────────────────

export const validateNumber = (field: string, min?: number, max?: number): ValidationChain => {
  let validator = body(field)
    .notEmpty()
    .withMessage(`${field} es requerido`)
    .isNumeric()
    .withMessage(`${field} debe ser un número`);

  if (min !== undefined) {
    validator = validator.custom((value) => {
      if (parseFloat(value) < min) {
        throw new Error(`${field} debe ser mayor o igual a ${min}`);
      }
      return true;
    });
  }

  if (max !== undefined) {
    validator = validator.custom((value) => {
      if (parseFloat(value) > max) {
        throw new Error(`${field} debe ser menor o igual a ${max}`);
      }
      return true;
    });
  }

  return validator;
};

// ─────────────────────────────────────────────────────────────
// Boolean Validator
// ─────────────────────────────────────────────────────────────

export const validateBoolean = (field: string): ValidationChain => {
  return body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} debe ser verdadero o falso`)
    .toBoolean();
};

// ─────────────────────────────────────────────────────────────
// Date Validator
// ─────────────────────────────────────────────────────────────

export const validateDate = (field: string): ValidationChain => {
  return body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} debe ser una fecha válida (ISO 8601)`)
    .toDate();
};

// ─────────────────────────────────────────────────────────────
// Enum Validator
// ─────────────────────────────────────────────────────────────

export const validateEnum = (field: string, allowedValues: string[]): ValidationChain => {
  return body(field)
    .notEmpty()
    .withMessage(`${field} es requerido`)
    .isIn(allowedValues)
    .withMessage(`${field} debe ser uno de: ${allowedValues.join(', ')}`);
};

// ─────────────────────────────────────────────────────────────
// Array Validator
// ─────────────────────────────────────────────────────────────

export const validateArray = (
  field: string,
  minLength: number = 0,
  maxLength?: number
): ValidationChain => {
  let validator = body(field)
    .isArray({ min: minLength })
    .withMessage(`${field} debe ser un array con al menos ${minLength} elementos`);

  if (maxLength !== undefined) {
    validator = validator
      .isArray({ max: maxLength })
      .withMessage(`${field} debe tener máximo ${maxLength} elementos`);
  }

  return validator;
};

// ─────────────────────────────────────────────────────────────
// URL Validator
// ─────────────────────────────────────────────────────────────

export const validateUrl = (field: string): ValidationChain => {
  return body(field).optional().isURL().withMessage(`${field} debe ser una URL válida`);
};

// ─────────────────────────────────────────────────────────────
// Pagination Validators
// ─────────────────────────────────────────────────────────────

export const validatePagination = (): ValidationChain[] => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número entero mayor a 0')
      .toInt(),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit debe ser entre 1 y 100')
      .toInt(),
  ];
};

// ─────────────────────────────────────────────────────────────
// Search Query Validator
// ─────────────────────────────────────────────────────────────

export const validateSearchQuery = (): ValidationChain => {
  return query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres')
    .escape();
};

// ─────────────────────────────────────────────────────────────
// Sort Validator
// ─────────────────────────────────────────────────────────────

export const validateSort = (allowedFields: string[]): ValidationChain => {
  return query('sort')
    .optional()
    .custom((value) => {
      const field = value.startsWith('-') ? value.substring(1) : value;
      if (!allowedFields.includes(field)) {
        throw new Error(`sort debe ser uno de: ${allowedFields.join(', ')}`);
      }
      return true;
    });
};

// ─────────────────────────────────────────────────────────────
// Price Validator (para productos)
// ─────────────────────────────────────────────────────────────

export const validatePrice = (field: string = 'precio'): ValidationChain => {
  return body(field)
    .notEmpty()
    .withMessage('El precio es requerido')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo')
    .toFloat();
};

// ─────────────────────────────────────────────────────────────
// Stock Validator
// ─────────────────────────────────────────────────────────────

export const validateStock = (field: string = 'stock'): ValidationChain => {
  return body(field)
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo')
    .toInt();
};
