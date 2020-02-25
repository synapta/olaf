const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 10;


// Insert new user
function insertUser(driver, email, password, username, callback) {
    // Generate hash and store new user
    checkUserExistence(driver, email, username, (err, res) => {
       if(!res){
           bcrypt.hash(password, saltRounds, (err, hash) => {
               // Store token
               let token = crypto.randomBytes(64).toString('hex');
               // Insert new user into collection
               driver.collection('users').insertOne({
                   '_id': email,
                   password: hash,
                   username: username,
                   token: token,
                   verified: false
               }).then(callback(email, token, false))
           });
       } else
           callback(null, null, true)
    });
}

// Find user by email (id), username or token
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

function findUserByToken(driver, token, callback) {
    driver.collection('users').findOne({token: token}, (err, res) => {
        callback(err, res);
    })
}

function checkUserExistence(driver, email, username, callback) {
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

// Verify user by token
function verifyUser(driver, token, callback) {
    findUserByToken(driver, token, (err, user) => {
        if(user) {
            driver.collection('users').findOneAndUpdate(
                {'_id': user._id, verified: false},
                {$set: {verified: true}},
                {returnNewDocument: true},
                (err, res) => {
                    callback(err, res);
                });
        } else
            callback(err, user);
    })
}

exports.insertUser = insertUser;
exports.findUserById = findUserById;
exports.findUserByUsername = findUserByUsername;
exports.findUserByToken = findUserByToken;
exports.checkUserExistence = checkUserExistence;
exports.retrieveUser = retrieveUser;
exports.verifyUser = verifyUser;