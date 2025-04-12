const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logLoginAttempt } = require('../utils/authLogger');

// Custom error messages
const AuthError = {
  USER_NOT_FOUND: 'No account with that email exists',
  INCORRECT_PASSWORD: 'Password is incorrect',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
  INACTIVE_ACCOUNT: 'Account is not active'
};

// Local Strategy for email/password login
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request
    },
    async (req, email, password, done) => {
      try {
        // 1. Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // 2. Check if user exists
        if (!user) {
          await logLoginAttempt(email, req.ip, false, 'User not found');
          return done(null, false, { message: AuthError.USER_NOT_FOUND });
        }

        // 3. Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
          await logLoginAttempt(email, req.ip, false, 'Account locked');
          return done(null, false, { message: AuthError.ACCOUNT_LOCKED });
        }

        // 4. Check if account is active
        if (!user.isActive) {
          await logLoginAttempt(email, req.ip, false, 'Inactive account');
          return done(null, false, { message: AuthError.INACTIVE_ACCOUNT });
        }

        // 5. Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          // Reset login attempts on successful login
          if (user.loginAttempts > 0 || user.lockUntil) {
            await User.findByIdAndUpdate(user._id, {
              $set: { loginAttempts: 0, lockUntil: null }
            });
          }
          
          await logLoginAttempt(email, req.ip, true, 'Successful login');
          return done(null, user);
        } else {
          // Handle failed login attempts
          const updates = {
            $inc: { loginAttempts: 1 }
          };

          // Lock account after 5 failed attempts for 15 minutes
          if (user.loginAttempts + 1 >= 5) {
            updates.$set = {
              lockUntil: Date.now() + 15 * 60 * 1000 // 15 minutes
            };
          }

          await User.findByIdAndUpdate(user._id, updates);
          await logLoginAttempt(email, req.ip, false, 'Incorrect password');
          return done(null, false, { message: AuthError.INCORRECT_PASSWORD });
        }
      } catch (err) {
        console.error('Authentication error:', err);
        await logLoginAttempt(email, req.ip, false, 'Server error');
        return done(err);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return done(new Error('User not found'));
    }
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err);
  }
});

// Middleware to check authentication
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/login');
};

// Middleware to check admin role
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'You do not have permission to view that page');
  res.redirect('/');
};

// Middleware to check API authentication
exports.isAuthenticatedAPI = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to check API admin role
exports.isAdminAPI = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden - Admin access required' });
};
const configurePassport = (passport) => {
    passport.use(
      new LocalStrategy(/* your config */)
    );
    
    passport.serializeUser(/* ... */);
    passport.deserializeUser(/* ... */);
  };
  
  // Export as a function
  module.exports = configurePassport;
  

module.exports = passport;