const { Schema, model, default: mongoose } = require('mongoose');
const bcrypt = require('bcrypt');

const getNextMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
};

const gameSchema = new Schema(
  {
    word: { type: String, required: true, lowercase: true, select: false },
    expiresAt: {
      type: Date,
      required: true,
      default: getNextMidnight,
      index: { expires: 0 }, // TTL
    },
    maxAttempts: { type: Number, default: 5 },
  },
  { timestamps: true }
);

const Game = model('Game', gameSchema);

module.exports = Game;
