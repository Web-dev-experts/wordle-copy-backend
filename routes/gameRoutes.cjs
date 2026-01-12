const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.cjs');
const gameController = require('../controllers/gameControllers.cjs');

router.get('/play', authController.protect, gameController.play);
router.post('/guess', authController.protect, gameController.guess);
router.get('/getWord', gameController.getWord);

module.exports = router;
