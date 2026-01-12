const express = require('express');
const authController = require('../controllers/authController.cjs');
const userController = require('../controllers/userController.cjs');

const router = express.Router();

router.route('/signin').post(authController.signup);
router.route('/login').post(authController.login);

router
  .route('/getAll')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getAllUsers
  );

router
  .route('/updateRole/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    authController.updateRole
  );

router
  .route('/forgotPassword')
  .post(authController.protect, authController.forgetPassword);

router
  .route('/resetPassword/:token')
  .patch(authController.protect, authController.resetPassword);

router
  .route('/me')
  .get(authController.protect, userController.getMe)
  .patch(authController.protect, userController.updateMe);

router
  .route('/deleteMe')
  .patch(authController.protect, userController.deleteMe);

router.route('/logout').get(authController.logout);

module.exports = router;
