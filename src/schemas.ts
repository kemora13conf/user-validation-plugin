import { Schema } from 'mongoose';

/**
 * Mongoose schema for validation entries
 */
export const ValidationSchema = {
  type: { type: String, enum: ['email', 'phone', 'identity', 'address'] },
  validated: { type: Boolean, default: false },
  code: { type: String },
  resends: { type: Number, default: 0, min: 0 },
  created: { type: Date, default: Date.now },
  last_try: { type: Date },
  tries: { type: Number, default: 0, min: 0 },
  expire_at: { type: Date },
  metadata: { type: Schema.Types.Mixed }
};