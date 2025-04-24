import { Validation, ValidationType, ValidationOptions } from './types';
/**
 * Generates a random validation code
 *
 * @param length The length of the code
 * @returns A random numeric code of specified length
 */
export declare const generateValidationCode: (length?: number) => string;
/**
 * Calculates the expiration date for a validation code
 *
 * @param expiresIn Time in seconds until the code expires
 * @returns A Date object representing when the code expires
 */
export declare const calculateExpiry: (expiresIn?: number) => Date;
/**
 * Creates a new validation object
 *
 * @param type The type of validation
 * @param options Optional settings for the validation
 * @param validated Whether it's already validated
 * @returns A validation object
 */
export declare const createValidation: (type: ValidationType, options?: ValidationOptions | undefined, validated?: boolean) => Validation;
