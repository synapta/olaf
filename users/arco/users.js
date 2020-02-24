const bcrypt = require('bcrypt');
const saltRounds = 10;


// Insert new user
function insertUser(driver, email, password, username, callback) {

    // Generate hash and store new user
    checkUser(driver, email, username, (err, res) => {
       if(!res){
           bcrypt.hash(password, saltRounds, (err, hash) => {
               driver.collection('users').insertOne({
                   '_id': email,
                   password: hash,
                   username: username
               }).then(callback(null))
           });
       } else
           callback(true)
    });

}

// Find user by email (id) or username
function findUserById(driver, email, callback) {
    driver.collection('users').findOne({'_id': email}, (err, res) => {
        callback(err, res);
    });
}

function findUserByUsername(driver, username, callback) {
    driver.collection('users').findOne({username: username}, (err, res) => {
        callback(err, res);
    });
}

function checkUser(driver, email, username, callback) {
    driver.collection('users').findOne({$or: [
        {'_id': email},
        {'username': username}
    ]}, (err, res) => {
        callback(err, res);
    })
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
exports.findUserByUsername = findUserByUsername;
exports.checkUser = checkUser;
exports.retrieveUser = retrieveUser;