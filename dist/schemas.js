"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSchema = void 0;
const mongoose_1 = require("mongoose");
/**
 * Mongoose schema for validation entries
 */
exports.ValidationSchema = {
    type: { type: String, enum: ['email', 'phone', 'identity', 'address'] },
    validated: { type: Boolean, default: false },
    code: { type: String },
    resends: { type: Number, default: 0, min: 0 },
    created: { type: Date, default: Date.now },
    last_try: { type: Date },
    tries: { type: Number, default: 0, min: 0 },
    expire_at: { type: Date },
    metadata: { type: mongoose_1.Schema.Types.Mixed }
};
