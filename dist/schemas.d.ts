import { Schema } from 'mongoose';
/**
 * Mongoose schema for validation entries
 */
export declare const ValidationSchema: {
    type: {
        type: StringConstructor;
        enum: string[];
    };
    validated: {
        type: BooleanConstructor;
        default: boolean;
    };
    code: {
        type: StringConstructor;
    };
    resends: {
        type: NumberConstructor;
        default: number;
        min: number;
    };
    created: {
        type: DateConstructor;
        default: () => number;
    };
    last_try: {
        type: DateConstructor;
    };
    tries: {
        type: NumberConstructor;
        default: number;
        min: number;
    };
    expire_at: {
        type: DateConstructor;
    };
    metadata: {
        type: typeof Schema.Types.Mixed;
    };
    _id: boolean;
};
