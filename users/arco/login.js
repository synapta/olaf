const passport = require('passport');
const db = require('./db');

const LocalStrategy = require('passport-local').Strategy;


function userLogin(driver, username, password) {

    passport.use(new LocalStrategy({
        usernameField: '_id',
        passwordField: 'password'
    }, (username, password, done) => {
        db.retrieveUser(driver, username, password, (err, user) => {

            // Handle error
            if (err) return done(err);
            // Handle not existing user
            if (!user)
                return done(null, false, { message: 'Incorrect username.' });
            return done(null, user);

        });

    }));

}
