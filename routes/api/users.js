const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');

//@route   POST api/users
//@desc    register user
//@access  Public
router.post(
  '/',
  [
    check('name', 'Please enter a Name').not().isEmpty(),
    check('email', 'Valid email address is required').isEmail(),
    check('password', 'Please enter a password of minimum 6 length').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      //See if user exists
      let user = await User.findOne({ email: email });
      if (user) {
        res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      //Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //Encrypt Password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();

      //Return jswebtoken

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('mySecretKey'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json(token);
        }
      );
    } catch (err) {
      console.log(err.message, err.name);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
