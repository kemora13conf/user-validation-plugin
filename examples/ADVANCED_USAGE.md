# Advanced Usage Examples for User Validation Plugin

This document covers advanced usage patterns for the user-validation-plugin package.

## Table of Contents
- [Custom Validation Workflows](#custom-validation-workflows)
- [Working with Metadata](#working-with-metadata)
- [Validation Expiry and Retry Logic](#validation-expiry-and-retry-logic)
- [API Integration Examples](#api-integration-examples)

## Custom Validation Workflows

### Two-Factor Authentication

You can use this plugin to implement two-factor authentication for sensitive operations:

```typescript
// Require 2FA for account operations
async function requestTwoFactorAuth(userId) {
  const user = await User.findById(userId);
  
  // Generate a new validation code for the user's phone
  const validation = user.createValidationRequest('phone', {
    codeLength: 6,
    expiresIn: 300, // 5 minutes
    maxTries: 3
  });
  
  // Send via SMS (implement your SMS provider integration)
  await sendSMS(user.phone, `Your verification code is ${validation.code}`);
  
  await user.save();
  return validation.expire_at; // Return expiry time to show countdown
}

// Verify 2FA code
async function verifyTwoFactorAuth(userId, code) {
  const user = await User.findById(userId);
  
  const isValid = user.validateCode('phone', code);
  if (isValid) {
    await user.save();
    return true;
  }
  
  // Check for failed attempts and lock if needed
  const phoneValidation = user.validations.find(v => v.type === 'phone');
  if (phoneValidation && phoneValidation.tries >= 3) {
    // Lock account or take appropriate action
    user.accountLocked = true;
    await user.save();
    throw new Error('Account locked due to too many failed attempts');
  }
  
  await user.save();
  return false;
}
```

### Delayed Validation Workflow

For some verification types like address verification, you might need a manual review process:

```typescript
// Request address verification
async function requestAddressVerification(userId, addressDetails) {
  const user = await User.findById(userId);
  
  // Create a validation request with metadata
  const validation = user.createValidationRequest('address');
  
  // Store detailed information in metadata
  validation.metadata = {
    addressLine1: addressDetails.line1,
    addressLine2: addressDetails.line2,
    city: addressDetails.city,
    state: addressDetails.state,
    postalCode: addressDetails.postalCode,
    country: addressDetails.country,
    verificationMethod: 'mail',
    requestDate: new Date(),
    status: 'pending'
  };
  
  await user.save();
  
  // Trigger an actual mail verification process
  await sendVerificationPostcard(user._id, addressDetails);
  
  return validation;
}

// Later, when verification is complete (e.g., user entered code from postcard)
async function completeAddressVerification(userId, postalCode) {
  const user = await User.findById(userId);
  
  // Use the code validation mechanism
  const isValid = user.validateCode('address', postalCode);
  
  if (isValid) {
    // Address validated!
    await user.save();
    return true;
  }
  
  await user.save();
  return false;
}
```

## Working with Metadata

The `metadata` field allows you to store additional information with each validation:

### Identity Verification

```typescript
// Store identity verification details
async function submitIdentityVerification(userId, document) {
  const user = await User.findById(userId);
  
  // Create identity validation request
  const validation = user.createValidationRequest('identity');
  
  // Store document details in metadata
  validation.metadata = {
    documentType: document.type, // passport, driver's license, etc.
    documentNumber: document.number,
    issuingCountry: document.country,
    expiryDate: document.expiryDate,
    submissionDate: new Date(),
    documentImageIds: [document.frontImageId, document.backImageId],
    verificationStatus: 'submitted'
  };
  
  await user.save();
  
  // Submit to verification service (KYC provider)
  await submitToKycProvider(userId, document, validation._id);
  
  return validation;
}

// Update verification status from KYC provider webhook
async function updateIdentityVerificationStatus(userId, verificationId, status, notes) {
  const user = await User.findById(userId);
  
  const validation = user.validations.find(v => 
    v.type === 'identity' && 
    v._id.toString() === verificationId
  );
  
  if (!validation) {
    throw new Error('Verification not found');
  }
  
  if (status === 'approved') {
    validation.validated = true;
  }
  
  // Update metadata
  validation.metadata = {
    ...validation.metadata,
    verificationStatus: status,
    reviewNotes: notes,
    reviewDate: new Date()
  };
  
  await user.save();
  return validation;
}
```

## Validation Expiry and Retry Logic

### Implementing a Resend Function

```typescript
async function resendValidationCode(userId, type) {
  const user = await User.findById(userId);
  
  // Find existing validation
  const validation = user.validations.find(v => v.type === type);
  
  if (!validation) {
    throw new Error(`No ${type} validation found`);
  }
  
  // Check if resends exceeded
  if (validation.resends >= 3) {
    throw new Error('Maximum resend attempts exceeded');
  }
  
  // Generate new code and update expiry
  validation.code = generateValidationCode();
  validation.expire_at = new Date(Date.now() + 3600 * 1000); // 1 hour from now
  validation.resends += 1;
  
  await user.save();
  
  // Send the code via appropriate channel
  if (type === 'email') {
    await sendVerificationEmail(user.email, validation.code);
  } else if (type === 'phone') {
    await sendVerificationSMS(user.phone, validation.code);
  }
  
  return {
    resends: validation.resends,
    maxResends: 3,
    expire_at: validation.expire_at
  };
}
```

### Handling Expired Validations

```typescript
async function checkValidationStatus(userId, type) {
  const user = await User.findById(userId);
  
  const validation = user.validations.find(v => v.type === type);
  
  if (!validation) {
    return { status: 'not_found' };
  }
  
  if (validation.validated) {
    return { status: 'validated' };
  }
  
  // Check if expired
  if (validation.expire_at && validation.expire_at < new Date()) {
    return { 
      status: 'expired',
      canResend: validation.resends < 3
    };
  }
  
  // Still valid
  return {
    status: 'pending',
    expires: validation.expire_at,
    attempts: validation.tries,
    maxAttempts: 5
  };
}
```

## API Integration Examples

### Email Verification Service

```typescript
async function triggerEmailVerification(userId) {
  const user = await User.findById(userId);
  
  // Create validation request
  const validation = user.createValidationRequest('email');
  
  // Generate verification link with token
  const verificationLink = `https://your-app.com/verify?user=${userId}&code=${validation.code}`;
  
  // Send verification email
  await emailService.send({
    to: user.email,
    subject: 'Verify your email address',
    html: `<p>Please verify your email by clicking on this link: <a href="${verificationLink}">Verify Email</a></p>
           <p>Or enter this code: ${validation.code}</p>`
  });
  
  await user.save();
  return true;
}

// Verification endpoint
async function verifyEmail(userId, code) {
  const user = await User.findById(userId);
  
  const isValid = user.validateCode('email', code);
  
  if (isValid) {
    // Update user privileges or unlock features that require verified email
    user.emailVerifiedAt = new Date();
    await user.save();
    return { success: true, message: 'Email verified successfully' };
  }
  
  return { success: false, message: 'Invalid or expired verification code' };
}
```

### Phone Verification via Twilio

```typescript
async function sendPhoneVerification(userId) {
  const user = await User.findById(userId);
  
  // Create phone validation
  const validation = user.createValidationRequest('phone', {
    codeLength: 6,
    expiresIn: 600 // 10 minutes
  });
  
  // Send via Twilio
  await twilioClient.messages.create({
    body: `Your verification code is: ${validation.code}`,
    from: '+1234567890', // Your Twilio number
    to: user.phone
  });
  
  await user.save();
  return { success: true, expiresIn: 600 };
}
```

These examples show how to integrate the plugin with various external services and implement complex validation workflows. Adjust the implementations to fit your specific requirements and business logic.