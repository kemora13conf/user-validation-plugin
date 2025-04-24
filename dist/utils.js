"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidation = exports.calculateExpiry = exports.generateValidationCode = void 0;
const config_1 = require("./config");
/**
 * Generates a random validation code
 *
 * @param length The length of the code
 * @returns A random numeric code of specified length
 */
const generateValidationCode = (length = config_1.defaultConfig.DEFAULT_CODE_LENGTH) => {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10).toString();
    }
    return code;
};
exports.generateValidationCode = generateValidationCode;
/**
 * Calculates the expiration date for a validation code
 *
 * @param expiresIn Time in seconds until the code expires
 * @returns A Date object representing when the code expires
 */
const calculateExpiry = (expiresIn = config_1.defaultConfig.DEFAULT_EXPIRY) => {
    const now = new Date();
    return new Date(now.getTime() + (expiresIn * 1000));
};
exports.calculateExpiry = calculateExpiry;
/**
 * Creates a new validation object
 *
 * @param type The type of validation
 * @param options Optional settings for the validation
 * @param validated Whether it's already validated
 * @returns A validation object
 */
const createValidation = (type, options, validated = false) => {
    const codeLength = options?.codeLength || config_1.defaultConfig.DEFAULT_CODE_LENGTH;
    const expiresIn = options?.expiresIn || config_1.defaultConfig.DEFAULT_EXPIRY;
    return {
        type,
        validated,
        created: new Date(),
        code: validated ? '' : (0, exports.generateValidationCode)(codeLength),
        resends: 0,
        tries: 0,
        expire_at: validated ? undefined : (0, exports.calculateExpiry)(expiresIn),
    };
};
exports.createValidation = createValidation;
