import { ValidationConfig } from './types';

/**
 * Default configuration for the validation plugin
 */
export const defaultConfig: ValidationConfig = {
  ENABLED: true,
  EMAIL_VALIDATION: true,
  PHONE_VALIDATION: true,
  IDENTITY_VALIDATION: true,
  ADDRESS_VALIDATION: true,
  DEFAULT_CODE_LENGTH: 6,
  DEFAULT_EXPIRY: 3600, // 1 hour in seconds
  MAX_TRIES: 5,
  MAX_RESENDS: 3
};