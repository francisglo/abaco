const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/coworkingUserController');
const authCtrl = require('../controllers/coworkingAuthController');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

module.exports = router;