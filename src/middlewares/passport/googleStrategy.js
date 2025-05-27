import GoogleStrategy from 'passport-google-oauth20';

import userService from '../../services/userService.js';

const googleStrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
};

async function verify(accessToken, refreshToken, profile, done) {
  const user = await userService.oauthCreateOrUpdate(
    profile.provider,
    profile.id,
    profile.emails[0].value,
    profile.displayName,
  );

  if (!user || !user.id) {
    console.error('❌ user undefined in verify()');
    return done(null, false); // 인증 실패 처리
  }
  done(null, user); // req.user = user;
}

const googleStrategy = new GoogleStrategy(googleStrategyOptions, verify);

export default googleStrategy;
