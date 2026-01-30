const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin', 'client'],
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
}, {
    timestamps: true,
});

const { encrypt, decrypt } = require('../utils/encryption');

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    if (!this.password.includes(':') && !this.password.startsWith('$2a$')) {
        this.password = encrypt(this.password);
    }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (this.password.startsWith('$2a$')) {
        return await bcrypt.compare(enteredPassword, this.password);
    }
    return decrypt(this.password) === enteredPassword;
};

module.exports = mongoose.model('User', userSchema);
