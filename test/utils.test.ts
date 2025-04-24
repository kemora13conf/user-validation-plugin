import { generateValidationCode, calculateExpiry, createValidation } from '../src/utils';
import { defaultConfig } from '../src/config';

describe('Validation Utils', () => {
  
  describe('generateValidationCode', () => {
    it('should generate a code with default length', () => {
      const code = generateValidationCode();
      expect(code).toHaveLength(defaultConfig.DEFAULT_CODE_LENGTH);
      expect(code).toMatch(/^\d+$/); // Only digits
    });
    
    it('should generate a code with specified length', () => {
      const length = 8;
      const code = generateValidationCode(length);
      expect(code).toHaveLength(length);
      expect(code).toMatch(/^\d+$/); // Only digits
    });
  });
  
  describe('calculateExpiry', () => {
    it('should calculate expiry date using default expiry time', () => {
      const before = new Date();
      const expiry = calculateExpiry();
      const after = new Date();
      
      // Should be in the future by DEFAULT_EXPIRY seconds
      const expectedMin = new Date(before.getTime() + defaultConfig.DEFAULT_EXPIRY * 1000 - 10); // Allow 10ms buffer
      const expectedMax = new Date(after.getTime() + defaultConfig.DEFAULT_EXPIRY * 1000 + 10); // Allow 10ms buffer
      
      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
    
    it('should calculate expiry date with custom expiry time', () => {
      const expiresIn = 300; // 5 minutes
      const before = new Date();
      const expiry = calculateExpiry(expiresIn);
      const after = new Date();
      
      // Should be in the future by expiresIn seconds
      const expectedMin = new Date(before.getTime() + expiresIn * 1000 - 10); // Allow 10ms buffer
      const expectedMax = new Date(after.getTime() + expiresIn * 1000 + 10); // Allow 10ms buffer
      
      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });
  
  describe('createValidation', () => {
    it('should create a validation object with default values', () => {
      const type = 'email';
      const validation = createValidation(type);
      
      expect(validation).toEqual({
        type,
        validated: false,
        created: expect.any(Date),
        code: expect.stringMatching(/^\d{6}$/), // Default 6-digit code
        resends: 0,
        tries: 0,
        expire_at: expect.any(Date),
      });
    });
    
    it('should create a validation object with custom options', () => {
      const type = 'phone';
      const options = {
        codeLength: 4,
        expiresIn: 1800, // 30 minutes
      };
      
      const validation = createValidation(type, options);
      
      expect(validation).toEqual({
        type,
        validated: false,
        created: expect.any(Date),
        code: expect.stringMatching(/^\d{4}$/), // 4-digit code as specified
        resends: 0,
        tries: 0,
        expire_at: expect.any(Date),
      });
    });
    
    it('should create a pre-validated validation object when specified', () => {
      const type = 'identity';
      const validated = true;
      
      const validation = createValidation(type, undefined, validated);
      
      expect(validation).toEqual({
        type,
        validated: true,
        created: expect.any(Date),
        code: '', // Empty code for pre-validated objects
        resends: 0,
        tries: 0,
        expire_at: undefined, // No expiry for pre-validated objects
      });
    });
  });
});