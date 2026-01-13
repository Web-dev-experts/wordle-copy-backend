require('dotenv').config({ path: '../config.env' });
const { promisify } = require('util');
const User = require('../models/userModel.cjs');
const catchAsync = require('../utils/catchAsync.cjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError.cjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const signToken = function (id) {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createSendToken = function (user, statusCode, res) {
  const token = signToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: false, // must be false in dev (localhost/http)
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sameSite: 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  createSendToken(user, 201, res);
  next();
});
exports.login = catchAsync(async (req, res, next) => {
  const { password, email } = req.body;
  if (!password || !email)
    return next(new AppError('Password or email is empty!', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPasswords(password, user.password)))
    return next(new AppError('Email or password is incorrect!', 400));

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  });

  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // 2) No token
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to continue.', 401)
    );
  }

  // 3) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 4) Check user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 5) Check password change
  if (user.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401)
    );
  }

  // 6) Grant access
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this act!', 403)
      );
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const loggedUser = await User.findOne({ email: req.body.email });

  if (!loggedUser)
    return next(new AppError('There is no user with this email!', 400));

  const resetToken = loggedUser.createPasswordResetToken();
  await loggedUser.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'WordleCopy<no-reply@wrdl.com>',
      to: 'user@example.com',
      subject: 'Your reset token ( expires in 10min )',
      text: resetUrl,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    loggedUser.passwordResetToken = undefined;
    loggedUser.passwordResetExpiry = undefined;
    await loggedUser.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+password');

  if (!user) return next(new AppError('Token invalid or expired!'), 401);

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordChangedAt = new Date(Date.now()).toISOString();
  user.passwordResetExpiry = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.newRole },
    { runValidators: false }
  );

  if (!user) return next(new AppError('This user does not exist!', 404));

  res.status(200).json({
    status: 'success',
  });
});