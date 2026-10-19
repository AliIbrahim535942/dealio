import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '../services/customer.service';
// Valid bcrypt hash used for constant-time comparison on unknown emails
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email);
        const hashToCompare = user?.password ?? DUMMY_HASH;
        const isMatch = await bcrypt.compare(password, hashToCompare);
        if (!user || !isMatch || !user.is_active) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        if (!user.is_email_verified) {
          return done(null, false, {
            message: 'Please verify your email before logging in',
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);
