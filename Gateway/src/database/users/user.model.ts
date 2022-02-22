import { Document, Schema, model, Model } from 'mongoose';

import { IUserSchema } from './user.interface';
import { HashInput, HashInputUsingSalt } from '@service/crypto/helpers';
import { UserRole, PasswordHashedWithSalt } from '@service/utils/types';

export const USER_COLLECTION_NAME: string = 'users';

const UserSchema: Schema = new Schema({
    'username': {
        type: String,
        unique: true,
        required: true
    },
    'password': {
        type: {
            'value': {
                type: String,
                required: true
            },
            'salt': {
                type: String,
                required: true,
                default: '0x0'
            }
        },
        required: true
    },
    'role': {
        type: String,
        required: true,
        enum: Object.values(UserRole),
        default: UserRole.USER
    }
}, { collection: USER_COLLECTION_NAME });

UserSchema.pre('validate', function (next): void {
    const user: IUserModel = this as IUserModel;
    const password: PasswordHashedWithSalt = user.password as PasswordHashedWithSalt;
    if (user.isNew || user.isModified('password')) {
        user.password = HashInput(password.value);
        return next();
    }
});

UserSchema.methods.verify_password = function (input: string): boolean {
    const user: IUserModel = this as IUserModel;
    const password: PasswordHashedWithSalt = user.password as PasswordHashedWithSalt;
    const hash: string = HashInputUsingSalt(input, password.salt);
    return password.value === hash;
};

export interface IUserModel extends Document, IUserSchema {
    verify_password: (input: string) => boolean
};
export const User: Model<IUserModel & Document> = model<IUserModel & Document>('User', UserSchema);