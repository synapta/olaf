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

    driver.collection('users').findOne({'_id': 'provaa@ciao.it'}, (err, res) => {

        // Not existing user
        if(err) callback(err, );
        // Compare user password with given token
        bcrypt.compare('prova', res.password, function(err, comparison) {
            callback(err, comparison ? res : comparison);
        });

    })

}

exports.insertUser = insertUser;
exports.retrieveUser = retrieveUser;