import { Schema, Document } from 'mongoose';

export type ValidationType = 'email' | 'phone' | 'identity' | 'address';

export interface Validation {
  type: ValidationType;
  validated: boolean;
  code: string;
  resends: number;
  created: Date;
  last_try?: Date;
  tries: number;
  expire_at?: Date;
  metadata?: Record<string, any>;
}

export interface ValidationOptions {
  expiresIn?: number; // Time in seconds until validation code expires
  codeLength?: number; // Length of generated validation code
  maxTries?: number; // Maximum number of attempts allowed 
  maxResends?: number; // Maximum number of resend requests allowed
}

export interface IValidatable extends Document {
  validations?: Validation[];
  email_validated: boolean;
  phone_validated: boolean;
  identity_validated: boolean;
  address_validated: boolean;
  isValidated(type: ValidationType): boolean;
  createValidationRequest(type: ValidationType, options?: ValidationOptions): Validation;
  validateCode(type: ValidationType, code: string): boolean;
}

export interface ValidationConfig {
  ENABLED: boolean;
  EMAIL_VALIDATION: boolean;
  PHONE_VALIDATION: boolean;
  IDENTITY_VALIDATION: boolean;
  ADDRESS_VALIDATION: boolean;
  DEFAULT_CODE_LENGTH: number;
  DEFAULT_EXPIRY: number; // In seconds
  MAX_TRIES: number;
  MAX_RESENDS: number;
}

export const defaultConfig: ValidationConfig;

export function createValidation(
  type: ValidationType,
  options?: ValidationOptions,
  validated?: boolean
): Validation;

export function generateValidationCode(length?: number): string;

export function calculateExpiry(expiresIn?: number): Date;

export function validationPlugin(
  schema: Schema,
  config?: Partial<ValidationConfig>
): void;

export const ValidationSchema: Record<string, any>;