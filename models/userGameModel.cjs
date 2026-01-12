const { Schema, model, default: mongoose } = require('mongoose');

const gameSchema = new Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  game: {
    type: mongoose.Schema.ObjectId,
    ref: 'Game',
  },
  attempts: { type: [Object], default: [] },
  isFinished: { type: Boolean, default: false },
  isWon: Boolean,
});

const UserGame = model('UserGame', gameSchema);

module.exports = UserGame;
