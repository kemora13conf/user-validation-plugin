import { Schema } from 'mongoose';
import { ValidationSchema } from './schemas';
import { IValidatable, ValidationType, ValidationConfig, ValidationOptions, Validation } from './types';
import { createValidation } from './utils';
import { defaultConfig } from './config';

/**
 * Mongoose validation plugin for email, phone, identity, and address validation
 * 
 * @param schema The mongoose schema to apply the plugin to
 * @param config Optional custom configuration
 */
export const validationPlugin = (
  schema: Schema,
  config: Partial<ValidationConfig> = {}
): void => {
  // Merge provided config with defaults
  const pluginConfig: ValidationConfig = {
    ...defaultConfig,
    ...config
  };

  schema.add({
    validations: [ValidationSchema],
  });

  // Virtual getters for validation status
  schema.virtual('email_validated').get(function(this: IValidatable): boolean {
    return this.isValidated('email');
  });

  schema.virtual('phone_validated').get(function(this: IValidatable): boolean {
    return this.isValidated('phone');
  });

  schema.virtual('identity_validated').get(function(this: IValidatable): boolean {
    return this.isValidated('identity');
  });

  schema.virtual('address_validated').get(function(this: IValidatable): boolean {
    return this.isValidated('address');
  });

  // Method to check if a specific type is validated
  schema.methods.isValidated = function(
    this: IValidatable,
    type: ValidationType,
  ): boolean {
    return this.validations?.find(v => v.type === type)?.validated ?? false;
  };

  // Method to create a new validation request
  schema.methods.createValidationRequest = function(
    this: IValidatable,
    type: ValidationType,
    options?: ValidationOptions
  ): Validation {
    const currentValidations = this.validations || [];
    
    // Remove any existing validation of this type
    const existingIndex = currentValidations.findIndex(v => v.type === type);
    if (existingIndex >= 0) {
      currentValidations.splice(existingIndex, 1);
    }
    
    // Create a new validation
    const newValidation = createValidation(type, options);
    currentValidations.push(newValidation);
    
    // Update the document
    this.validations = currentValidations;
    
    return newValidation;
  };

  // Method to validate a code for a specific type
  schema.methods.validateCode = function(
    this: IValidatable,
    type: ValidationType,
    code: string
  ): boolean {
    const currentValidations = this.validations || [];
    
    // Find the validation record
    const validation = currentValidations.find(v => v.type === type);
    if (!validation) {
      return false;
    }
    
    // Already validated
    if (validation.validated) {
      return true;
    }
    
    // Check if expired
    if (validation.expire_at && validation.expire_at < new Date()) {
      return false;
    }
    
    // Update tries counter
    validation.tries += 1;
    validation.last_try = new Date();
    
    // Check if max tries exceeded
    if (validation.tries > pluginConfig.MAX_TRIES) {
      return false;
    }
    
    // Validate the code
    const isValid = validation.code === code;
    if (isValid) {
      validation.validated = true;
    }
    
    return isValid;
  };

  // Pre-save middleware to handle auto-validation based on config
  schema.pre('save', function(this: IValidatable, next) {
    // Skip validation handling if disabled
    if (!pluginConfig.ENABLED) {
      return next();
    }
    
    // Only handle auto-validation for new documents
    if (this.isNew) {
      const currentValidations = this.validations || [];
      let hasChanges = false;

      // Auto-validate email if configured
      if (!pluginConfig.EMAIL_VALIDATION) {
        const emailValidation = currentValidations.find(v => v.type === 'email');
        if (!emailValidation) {
          currentValidations.push(createValidation('email', undefined, true));
          hasChanges = true;
        } else if (!emailValidation.validated) {
          emailValidation.validated = true;
          hasChanges = true;
        }
      }

      // Auto-validate phone if configured
      if (!pluginConfig.PHONE_VALIDATION) {
        const phoneValidation = currentValidations.find(v => v.type === 'phone');
        if (!phoneValidation) {
          currentValidations.push(createValidation('phone', undefined, true));
          hasChanges = true;
        } else if (!phoneValidation.validated) {
          phoneValidation.validated = true;
          hasChanges = true;
        }
      }
      
      // Auto-validate identity if configured
      if (!pluginConfig.IDENTITY_VALIDATION) {
        const identityValidation = currentValidations.find(v => v.type === 'identity');
        if (!identityValidation) {
          currentValidations.push(createValidation('identity', undefined, true));
          hasChanges = true;
        } else if (!identityValidation.validated) {
          identityValidation.validated = true;
          hasChanges = true;
        }
      }
      
      // Auto-validate address if configured
      if (!pluginConfig.ADDRESS_VALIDATION) {
        const addressValidation = currentValidations.find(v => v.type === 'address');
        if (!addressValidation) {
          currentValidations.push(createValidation('address', undefined, true));
          hasChanges = true;
        } else if (!addressValidation.validated) {
          addressValidation.validated = true;
          hasChanges = true;
        }
      }

      // Update validations array if changes were made
      if (hasChanges) {
        this.validations = currentValidations;
      }
    }

    next();
  });

  // Compound indexes for better query performance
  schema.index({ 'validations.type': 1, 'validations.validated': 1 });
  schema.index({ 'validations.type': 1, 'validations.expire_at': 1 });
};

// Export all the components
export * from './types';
export * from './schemas';
export * from './utils';
export * from './config';