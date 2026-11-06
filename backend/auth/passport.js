// TODO(Jerith): configure the Passport local strategy.
//  - LocalStrategy: look up the user by username and compare with bcryptjs.
//  - serializeUser: store String(user._id) in the session.
//  - deserializeUser: load the user with findUserById (without passwordHash).
// req.user must have at least { _id, username }; the reviews API relies on both.
import { findUserById } from "../db/users.js";

export function configurePassport(passport) {
  passport.serializeUser((user, done) => done(null, String(user._id)));

  passport.deserializeUser(async (id, done) => {
    try {
      done(null, (await findUserById(id)) || false);
    } catch (err) {
      done(err);
    }
  });
}
