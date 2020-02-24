const bcrypt = require('bcrypt');
const saltRounds = 10;


// Insert new user
function insertUser(driver) {

    // Generate hash and store new user
    bcrypt.hash('prova', saltRounds, (err, hash) => {
        driver.collection('users').insertOne({
            '_id': 'provaa@ciao.it',
            password: hash,
            username: 'username'
        })
    });

}

// Retrieve user by email (id)
function retrieveUser(driver, username, password, callback) {

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