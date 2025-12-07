// ═══════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE
// Manejo de errores de express-validator
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

// ─────────────────────────────────────────────────────────────
// Validation Error Handler
// ─────────────────────────────────────────────────────────────

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors.array());

    res.status(400).json({
      error: 'Validation Error',
      message: 'Los datos enviados son inválidos',
      errors: formattedErrors,
    });
    return;
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// Format Validation Errors
// ─────────────────────────────────────────────────────────────

interface FormattedError {
  field: string;
  message: string;
  value?: any;
}

function formatValidationErrors(errors: ValidationError[]): FormattedError[] {
  return errors.map((error) => {
    if (error.type === 'field') {
      return {
        field: error.path,
        message: error.msg,
        value: error.value,
      };
    }
    
    // Para errores que no son de campo
    return {
      field: 'unknown',
      message: typeof error. msg === 'string' ? error.msg : 'Validation error',
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Validate Request (alias más corto)
// ─────────────────────────────────────────────────────────────

export const validate = handleValidationErrors;