require('dotenv').config({ path: './config.env' });
const { createDailyGame } = require('./utils/createNewGame.cjs');
const Game = require('./models/gameModel.cjs');
const mongoose = require('mongoose');
const app = require('./app.cjs');

const DB_LINK = process.env.DATABASE;

async function createGame() {
  const activeGame = await Game.findOne({
    expiresAt: { $gt: new Date() },
  });

  if (!activeGame) {
    await createDailyGame();
  }
}

(async () => {
  try {
    console.log('Connecting...');
    await mongoose.connect(DB_LINK);
    console.log('DB connected');
    createGame();

    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
