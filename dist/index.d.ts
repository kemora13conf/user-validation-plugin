import { Schema } from 'mongoose';
import { ValidationConfig } from './types';
/**
 * Mongoose validation plugin for email, phone, identity, and address validation
 *
 * @param schema The mongoose schema to apply the plugin to
 * @param config Optional custom configuration
 */
export declare const validationPlugin: (schema: Schema, config?: Partial<ValidationConfig>) => void;
export * from './types';
export * from './schemas';
export * from './utils';
export * from './config';
