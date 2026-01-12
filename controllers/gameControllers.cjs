const Game = require('../models/gameModel.cjs');
const UserGame = require('../models/userGameModel.cjs');
const AppError = require('../utils/AppError.cjs');
const catchAsync = require('../utils/catchAsync.cjs');

exports.play = catchAsync(async function (req, res, next) {
  const game = await Game.findOne();
  if (!game) return next(new AppError('No active game!', 500));

  if (game.expiresAt < new Date(new Date())) {
    return next(new AppError('This game has expired!'));
  }

  let userGame = await UserGame.findOne({
    user: req.user._id,
    game: game._id,
  });

  if (!userGame) {
    userGame = await UserGame.create({
      user: req.user._id,
      game: game._id,
    });
  }
  res.status(200).json({
    status: 'success',
    maxAttempts: game.maxAttempts,
    attempts: userGame.attempts,
    isFinished: userGame.isFinished,
  });
});

exports.guess = catchAsync(async function (req, res, next) {
  const { guess } = req.body;

  const currentUserGame = await UserGame.findOne({
    user: req.user._id,
  });

  const game = await Game.findOne().select('+word');

  currentUserGame.attempts.push(guess);

  const guessStr =
    guess[0].letter +
    guess[1].letter +
    guess[2].letter +
    guess[3].letter +
    guess[4].letter;
  if (currentUserGame.isFinished === true)
    return next(new AppError('Game already ended', 500));

  if (guessStr && guessStr.toLowerCase() === game.word) {
    currentUserGame.isWon = true;
    currentUserGame.isFinished = true;
  }

  if (currentUserGame.attempts.length >= game.maxAttempts) {
    currentUserGame.isFinished = true;
    currentUserGame.isWon = false;
  }

  await currentUserGame.save();

  res.status(200).json({
    status: 'success',
    data: {
      attempts: currentUserGame.attempts,
      isFinished: currentUserGame.isFinished,
      isWon: currentUserGame.isWon,
    },
  });
});

exports.getWord = catchAsync(async function (req, res, next) {
  const game = await Game.findOne().select('+word');
  if (!game) return next(new AppError('No game was created yet!', 400));
  res.status(200).json({
    status: 'success',
    word: game.word,
  });
});
