const bcrypt = require('bcrypt');
const saltRounds = 10;


// Insert new user
function insertUser(driver, email, password, username, callback) {

    // Generate hash and store new user
    bcrypt.hash(password, saltRounds, (err, hash) => {
        driver.collection('users').insertOne({
            '_id': email,
            password: hash,
            username: username
        }, callback())
    });

}

// Find user by email (if)
function findUserById(driver, email, callback) {

    driver.collection('users').findOne({'_id': email}, (err, res) => {
        callback(err, res);
    });

}

// Retrieve user by email (id)
function retrieveUser(driver, email, password, callback) {

    findUserById(driver, email, (err, res) => {

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
exports.findUserById = findUserById;
exports.retrieveUser = retrieveUser;