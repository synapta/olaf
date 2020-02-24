const bcrypt = require('bcrypt');
const saltRounds = 10;


// Insert new user
function insertUser(driver, email, username, password, callback) {

    // Generate hash and store new user
    bcrypt.hash(password, saltRounds, (err, hash) => {
        driver.collection('users').insertOne({
            '_id': email,
            password: hash,
            username: username
        }, callback)
    });

}

// Retrieve user by email (id)
function retrieveUser(driver, email, password, callback) {

    driver.collection('users').findOne({'_id': username}, (err, res) => {

        // Not existing user
        if(err)
            callback(err, null);
        else if (!res)
            callback(null, null);
        else {
            // Compare user password with given token
            bcrypt.compare(password, res.password, (err, comparison) => {
                callback(null, comparison ? res : comparison);
            });
        }

    });

}

exports.insertUser = insertUser;
exports.retrieveUser = retrieveUser;