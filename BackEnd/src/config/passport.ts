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
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateGoogleUser } from '../services/customer.service';
import { config } from './env';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'Google account has no email' });
        }

        // email_verified ممكن يجي boolean أو نص حسب النسخة
        const raw = (profile._json as { email_verified?: boolean | string })
          .email_verified;
        const emailVerified = raw === true || raw === 'true';

        const user = await findOrCreateGoogleUser({
          googleId: profile.id,
          email,
          fullName: profile.displayName || email.split('@')[0],
          emailVerified,
        });
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);