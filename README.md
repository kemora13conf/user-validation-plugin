# User Validation Plugin

A TypeScript plugin for Mongoose that provides validation functionality for email, phone, identity, and address.

## Installation

```bash
npm install user-validation-plugin
```

## Usage

```typescript
import mongoose from 'mongoose';
import { validationPlugin } from 'user-validation-plugin';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
});

// Apply the plugin with default configuration
UserSchema.plugin(validationPlugin);

// With custom configuration
UserSchema.plugin(validationPlugin, {
  ENABLED: true,
  EMAIL_VALIDATION: false, // Auto-validate emails
  PHONE_VALIDATION: true,  // Require phone validation
  IDENTITY_VALIDATION: true, // Require identity validation
  ADDRESS_VALIDATION: false, // Auto-validate address
  DEFAULT_CODE_LENGTH: 6, // 6-digit codes
  DEFAULT_EXPIRY: 3600, // 1 hour expiry
  MAX_TRIES: 5, // Maximum 5 attempts
  MAX_RESENDS: 3 // Maximum 3 resends
});

const User = mongoose.model('User', UserSchema);
```

## API

### Plugin Options

- `ENABLED`: Whether validation is enabled at all (default: `true`)
- `EMAIL_VALIDATION`: Whether email validation is required (default: `true`)
- `PHONE_VALIDATION`: Whether phone validation is required (default: `true`)
- `IDENTITY_VALIDATION`: Whether identity validation is required (default: `true`)
- `ADDRESS_VALIDATION`: Whether address validation is required (default: `true`)
- `DEFAULT_CODE_LENGTH`: Length of generated validation codes (default: `6`)
- `DEFAULT_EXPIRY`: Default expiration time in seconds (default: `3600` - 1 hour)
- `MAX_TRIES`: Maximum number of validation attempts (default: `5`)
- `MAX_RESENDS`: Maximum number of code resend requests (default: `3`)

### Schema Methods and Virtuals

- `document.email_validated`: Virtual getter for email validation status
- `document.phone_validated`: Virtual getter for phone validation status
- `document.identity_validated`: Virtual getter for identity validation status
- `document.address_validated`: Virtual getter for address validation status
- `document.isValidated(type)`: Method to check if a specific type is validated
- `document.createValidationRequest(type, options)`: Method to create a new validation request
- `document.validateCode(type, code)`: Method to validate a submitted code

## Validation Types

The plugin supports the following validation types:
- `email`: For email address validation
- `phone`: For phone number validation
- `identity`: For identity verification (passport, ID card, etc.)
- `address`: For physical address verification

## Validation Schema

The plugin adds a `validations` array to your schema with the following structure:

```typescript
{
  type: "email" | "phone" | "identity" | "address",
  validated: boolean,
  code: string,
  resends: number,
  created: Date,
  last_try?: Date,
  tries: number,
  expire_at?: Date,
  metadata?: Record<string, any>
}
```

## Examples

### Checking Validation Status

```typescript
// Check if email is validated
if (user.email_validated) {
  // Email is validated
}

// Check if phone is validated 
if (user.phone_validated) {
  // Phone is validated
}

// Check if identity is validated
if (user.identity_validated) {
  // Identity is validated
}

// Generic check
if (user.isValidated('email')) {
  // Email is validated
}
```

### Creating Validation Requests

```typescript
// Generate a new validation code for a phone number
const validation = user.createValidationRequest('phone', {
  codeLength: 4, // Generate a 4-digit code
  expiresIn: 1800, // Expires in 30 minutes
  maxTries: 3 // Maximum 3 attempts
});

console.log('Validation code:', validation.code);
console.log('Expires at:', validation.expire_at);

// Save the user to persist the validation request
await user.save();
```

### Validating Codes

```typescript
// Validate a code submitted by a user
const submittedCode = '123456'; // This would come from user input
const isValid = user.validateCode('phone', submittedCode);

if (isValid) {
  // Code is valid, the phone is now validated
  await user.save(); // Save the updated validation status
} else {
  // Invalid code, tries counter gets incremented
}
```

### Using Metadata

```typescript
// Create an identity validation request with additional metadata
const identityValidation = user.createValidationRequest('identity');

// Add additional metadata
identityValidation.metadata = {
  documentType: 'passport',
  documentNumber: 'A12345678',
  issuedBy: 'United States',
  scanned: true
};

await user.save();
```

### Auto-validation

When validation is disabled for a type in the plugin config, new documents will be automatically marked as validated for that type:

```typescript
// Auto-validate emails and addresses
UserSchema.plugin(validationPlugin, {
  EMAIL_VALIDATION: false,
  ADDRESS_VALIDATION: false
});

// Now any new user will have email_validated = true
const user = new User({
  name: "Test User",
  email: "test@example.com",
  address: "123 Main St"
});

await user.save();
console.log(user.email_validated); // true
console.log(user.address_validated); // true
console.log(user.phone_validated); // false - requires validation
```

## License

MIT