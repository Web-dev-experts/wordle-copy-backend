const User = require('../models/userModel.cjs');
const AppError = require('../utils/AppError.cjs');
const catchAsync = require('../utils/catchAsync.cjs');
const filterObj = require('../utils/filterObj.cjs');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  if (!users) return next(new AppError('There is no user!', 404));

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const loggedUser = req.user;

  if (!loggedUser)
    next(new AppError('You must be logged in to perform this action!', 403));

  if (req.body.password || req.body.passwordConfirm)
    next(
      new AppError(
        "You can't update your password in this route! Please go to /users/updatePassword to update your password"
      )
    );

  const filteredBody = filterObj(req.body, 'email', 'name');

  const updatedUser = await User.findByIdAndUpdate(
    loggedUser._id,
    filteredBody,
    {
      runValidators: true,
      new: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const formatedUser = {
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  res.status(200).json({
    status: 'success',
    data: {
      user: formatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { active: false },
    {
      runValidators: false,
    }
  );

  res.status(204).json({
    status: 'success',
  });
});
