const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Login Page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout(() => {
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

// Register Page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// Register Handle
router.post('/register', async (req, res) => {
  const { username, email, password, password2 } = req.body;
  let errors = [];

  // Validation
  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      username,
      email,
      password,
      password2
    });
  } else {
    try {
      const user = await User.findOne({ email });
      if (user) {
        errors.push({ msg: 'Email already registered' });
        res.render('register', {
          errors,
          username,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          username,
          email,
          password,
          role: 'user' // Default role
        });

        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
      }
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Server Error' });
    }
  }
});

module.exports = router;