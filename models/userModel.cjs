const { Schema, model } = require('mongoose');
const { default: isEmail } = require('validator/lib/isEmail');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // CommonJS

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'The user must have a name! Please enter your name'],
  },
  email: {
    type: String,
    required: [true, 'The user must have an email! Please enter your email'],
    unique: true,
    validate: {
      validator: function (v) {
        return isEmail(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  password: {
    type: String,
    required: [
      true,
      'The user must have a password! Please enter your password',
    ],
    minlength: [8, 'Password must be more than 8 characters'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      validator: function (v) {
        return this.password === v;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

// 🔒 Pre-save: hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  // hash password
  this.password = await bcrypt.hash(this.password, 12);

  // remove confirmPassword
  this.confirmPassword = undefined;

  // set passwordChangedAt for existing users
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
});

// ✅ Instance method: check password
userSchema.methods.checkPasswords = async function (
  candidatePassword,
  actualPassword
) {
  return bcrypt.compare(candidatePassword, actualPassword);
};

// ✅ Instance method: check if password changed after JWT issued
userSchema.methods.passwordChangedAfter = function (JWTtimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );
  return changedTimestamp > JWTtimestamp;
};

// ✅ Instance method: create password reset token
userSchema.methods.createPasswordResetToken = function () {
  // generate plain reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // hash it and store in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set expiry (10 minutes)
  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000;

  // return plain token for sending in email
  return resetToken;
};

const User = model('User', userSchema);

module.exports = User;
