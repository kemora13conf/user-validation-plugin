import { Validation, ValidationType, ValidationOptions } from './types';
import { defaultConfig } from './config';

/**
 * Generates a random validation code
 * 
 * @param length The length of the code
 * @returns A random numeric code of specified length
 */
export const generateValidationCode = (length: number = defaultConfig.DEFAULT_CODE_LENGTH): string => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

/**
 * Calculates the expiration date for a validation code
 * 
 * @param expiresIn Time in seconds until the code expires
 * @returns A Date object representing when the code expires
 */
export const calculateExpiry = (expiresIn: number = defaultConfig.DEFAULT_EXPIRY): Date => {
  const now = new Date();
  return new Date(now.getTime() + (expiresIn * 1000));
};

/**
 * Creates a new validation object
 * 
 * @param type The type of validation
 * @param options Optional settings for the validation
 * @param validated Whether it's already validated
 * @returns A validation object
 */
export const createValidation = (
  type: ValidationType,
  options?: ValidationOptions | undefined,
  validated: boolean = false
): Validation => {
  const codeLength = options?.codeLength || defaultConfig.DEFAULT_CODE_LENGTH;
  const expiresIn = options?.expiresIn || defaultConfig.DEFAULT_EXPIRY;
  
  return {
    type,
    validated,
    created: new Date(),
    code: validated ? '' : generateValidationCode(codeLength),
    resends: 0,
    tries: 0,
    expire_at: validated ? undefined : calculateExpiry(expiresIn),
  };
};