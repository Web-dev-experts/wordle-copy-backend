const Game = require("../models/gameModel.cjs");

const pickRandomWord = async function () {
  try {
    const res = await fetch(
      "https://random-word-api.herokuapp.com/word?length=5"
    );
    if (!res.ok) throw new Error("Could not fetch");
    const fetched = await res.json();
    console.log(fetched);
    return fetched[0];
  } catch (error) {
    console.error(error);
    return;
  }
};

exports.createDailyGame = async function () {
  // Optional: remove expired games
  await Game.deleteMany({ expiresAt: { $lt: new Date() } });

  const word = pickRandomWord(); // your logic

  await Game.create({
    word,
  });

  console.log("✅ New daily game created");
};
