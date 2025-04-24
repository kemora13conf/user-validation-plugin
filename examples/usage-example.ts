import mongoose, { Schema, Document } from 'mongoose';
// In a real project, this would be:
// import { validationPlugin, Validation, ValidationType, ValidationOptions } from 'user-validation-plugin';
// But for this example, we're importing from the local src directory
import { validationPlugin, Validation, ValidationType, ValidationOptions } from '../src';

// Define the user interface
interface User extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  validations?: Validation[];
  // These will be added by the plugin
  email_validated: boolean;
  phone_validated: boolean;
  identity_validated: boolean;
  address_validated: boolean;
  isValidated(type: ValidationType): boolean;
  createValidationRequest(type: ValidationType, options?: ValidationOptions): Validation;
  validateCode(type: ValidationType, code: string): boolean;
}

// Create a schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String }
});

// Apply the validation plugin with default config
UserSchema.plugin(validationPlugin);

// Or with custom configuration
/*
UserSchema.plugin(validationPlugin, {
  ENABLED: true,
  EMAIL_VALIDATION: false, // Auto-validate emails
  PHONE_VALIDATION: true,  // Require phone validation
  IDENTITY_VALIDATION: true, // Require identity validation
  ADDRESS_VALIDATION: false, // Auto-validate address
  DEFAULT_CODE_LENGTH: 6, // 6-digit codes
  DEFAULT_EXPIRY: 3600, // 1 hour expiry in seconds
  MAX_TRIES: 5, // Maximum 5 attempts
  MAX_RESENDS: 3 // Maximum 3 resends
});
*/

// Create the model
const UserModel = mongoose.model<User>('User', UserSchema);

// Example usage
async function createUser() {
  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/example-db');
  
  try {
    // Create a new user
    const user = new UserModel({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St, Anytown, USA'
    });
    
    await user.save();
    
    // Check validation status
    console.log('Email validated:', user.email_validated);
    console.log('Phone validated:', user.phone_validated);
    console.log('Identity validated:', user.identity_validated);
    console.log('Address validated:', user.address_validated);
    
    // Create a validation request for phone
    if (!user.phone_validated) {
      // Create a phone validation with custom options
      const phoneValidation = user.createValidationRequest('phone', {
        codeLength: 4, // Shorter code
        expiresIn: 1800, // Expires in 30 minutes
        maxTries: 3, // Only 3 attempts allowed
        maxResends: 1 // Only 1 resend allowed
      });
      
      console.log('Phone validation code:', phoneValidation.code);
      console.log('Expires at:', phoneValidation.expire_at);
      
      // Save the user to persist the validation request
      await user.save();
      
      // Simulate a validation code submission (typically from a user input)
      const submittedCode = phoneValidation.code; // In a real scenario, this would come from user input
      const isValid = user.validateCode('phone', submittedCode);
      
      if (isValid) {
        console.log('Phone number validated successfully!');
        await user.save(); // Save the updated validation status
      }
    }
    
    // Create an identity validation request with metadata
    if (!user.identity_validated) {
      const identityValidation = user.createValidationRequest('identity');
      
      // Add additional metadata
      identityValidation.metadata = {
        documentType: 'passport',
        documentNumber: 'A12345678',
        issuedBy: 'United States',
        scanned: true
      };
      
      await user.save();
      
      // Later, manually validate it after verification
      if (!user.identity_validated) {
        if (!user.validations) {
          user.validations = [];
        }
        
        const validation = user.validations.find(v => v.type === 'identity');
        if (validation) {
          validation.validated = true;
          await user.save();
          console.log('Identity now validated');
        }
      }
    }
    
    // Clean up
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

// Run the example
// createUser().catch(console.error);

export { UserModel, UserSchema };