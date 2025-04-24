# Migration Guide

This guide helps you migrate from manual validation implementations or previous versions of this plugin to the latest version.

## Migrating from Manual Validation

If you previously used a custom implementation for handling email and phone validation, follow these steps to migrate to user-validation-plugin.

### Before Migration

Your code might have looked like this:

```typescript
// Your schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  emailVerified: { type: Boolean, default: false },
  emailVerificationCode: String,
  emailVerificationExpiry: Date,
  phoneVerified: { type: Boolean, default: false },
  phoneVerificationCode: String,
  phoneVerificationExpiry: Date
});

// Your verification methods
UserSchema.methods.generateEmailVerification = function() {
  this.emailVerificationCode = generateRandomCode();
  this.emailVerificationExpiry = new Date(Date.now() + 3600 * 1000);
  return this.emailVerificationCode;
};

UserSchema.methods.verifyEmail = function(code) {
  if (this.emailVerificationCode === code && this.emailVerificationExpiry > new Date()) {
    this.emailVerified = true;
    this.emailVerificationCode = undefined;
    this.emailVerificationExpiry = undefined;
    return true;
  }
  return false;
};

// Similar methods for phone
```

### After Migration

With user-validation-plugin, your code becomes:

```typescript
import { validationPlugin } from 'user-validation-plugin';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String
});

// Apply the plugin
UserSchema.plugin(validationPlugin);

// Email verification
async function sendEmailVerification(userId) {
  const user = await User.findById(userId);
  const verification = user.createValidationRequest('email');
  
  // Send the verification code via email
  // ...
  
  await user.save();
  return verification;
}

async function verifyEmail(userId, code) {
  const user = await User.findById(userId);
  const isValid = user.validateCode('email', code);
  
  if (isValid) {
    await user.save();
    return true;
  }
  return false;
}

// Similarly for phone
```

### Migration Steps

1. **Install the plugin**: `npm install user-validation-plugin`

2. **Apply the plugin to your schema**: 
   ```typescript
   import { validationPlugin } from 'user-validation-plugin';
   UserSchema.plugin(validationPlugin);
   ```

3. **Remove old validation fields** from your schema (emailVerified, emailVerificationCode, etc.)

4. **Update your database**:
   ```typescript
   // Migration script
   async function migrateUsers() {
     const users = await User.find({});
     
     for (const user of users) {
       if (!user.validations) {
         user.validations = [];
       }
       
       // Migrate email validation status
       if (user.emailVerified) {
         user.validations.push({
           type: 'email',
           validated: true,
           code: '',
           resends: 0,
           tries: 0,
           created: new Date()
         });
       } else if (user.emailVerificationCode) {
         user.validations.push({
           type: 'email',
           validated: false,
           code: user.emailVerificationCode,
           resends: 0,
           tries: 0,
           created: new Date(),
           expire_at: user.emailVerificationExpiry
         });
       }
       
       // Migrate phone validation status (similar approach)
       
       // Remove old fields
       user.emailVerified = undefined;
       user.emailVerificationCode = undefined;
       user.emailVerificationExpiry = undefined;
       user.phoneVerified = undefined;
       user.phoneVerificationCode = undefined;
       user.phoneVerificationExpiry = undefined;
       
       await user.save();
     }
     
     console.log(`Migrated ${users.length} users`);
   }
   ```

5. **Update your API endpoints** to use the new plugin methods

## Migrating from Earlier Versions

### Version 0.x to 1.0

If you're migrating from an earlier version (0.x) of this plugin to 1.0:

1. **Install the latest version**:
   ```bash
   npm install user-validation-plugin@latest
   ```

2. **Update configuration**:
   ```typescript
   // Before (v0.x)
   UserSchema.plugin(validationPlugin, {
     validateEmail: true,
     validatePhone: true
   });
   
   // After (v1.0)
   UserSchema.plugin(validationPlugin, {
     EMAIL_VALIDATION: true,
     PHONE_VALIDATION: true,
     IDENTITY_VALIDATION: true, // New in v1.0
     ADDRESS_VALIDATION: true   // New in v1.0
   });
   ```

3. **Update API usage**:
   ```typescript
   // Before (v0.x)
   const verified = user.verifyValidation('email', code);
   
   // After (v1.0)
   const verified = user.validateCode('email', code);
   ```

4. **Add support for new validation types**:
   v1.0 adds support for identity and address validation. You can now use:
   ```typescript
   user.createValidationRequest('identity', options);
   user.createValidationRequest('address', options);
   ```

5. **Update property access**:
   ```typescript
   // New properties in v1.0
   user.identity_validated; // boolean
   user.address_validated; // boolean
   ```

6. **Use metadata for rich validation data**:
   ```typescript
   // New in v1.0
   const validation = user.createValidationRequest('identity');
   validation.metadata = {
     documentType: 'passport',
     documentNumber: '123456789'
   };
   ```

## Common Issues

### Missing Validations

If validations aren't showing up after migration:

```typescript
// Check if validations array exists
if (!user.validations) {
  user.validations = [];
  await user.save();
}
```

### Incompatible Types

If you get TypeScript errors:

```typescript
// Update your interfaces
interface User extends Document {
  // Add the new validation properties
  email_validated: boolean;
  phone_validated: boolean;
  identity_validated: boolean;
  address_validated: boolean;
  isValidated(type: ValidationType): boolean;
  createValidationRequest(type: ValidationType, options?: ValidationOptions): Validation;
  validateCode(type: ValidationType, code: string): boolean;
  // ...
}
```

### Database Queries

If you previously queried based on validation status:

```typescript
// Before
const verifiedUsers = await User.find({ emailVerified: true });

// After
const verifiedUsers = await User.find({ 
  'validations': { 
    $elemMatch: { 
      type: 'email', 
      validated: true 
    } 
  } 
});
```

## Need Help?

If you encounter issues during migration, please open an issue on our GitHub repository with details about your environment, mongoose version, and any error messages.