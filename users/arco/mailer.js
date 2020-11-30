const nodemailer = require('nodemailer');

// Store GMAIL auth
let gmailAuth = {
    user: 'davide@synapta.it',
    pass: 'sosvwwkejzqikprg'
};

// Initializer transporter
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    auth: gmailAuth
});

// Verification email configuration
let emailConfiguration = (destination, verification, redirect) => {
    return {
        from: 'olaf@synapta.io',
        to: destination,
        subject: 'Conferma la tua email',
        html: `<a href="http://localhost:3646/api/v1/arco/verify-user/${verification}${redirect ? '?redirect=' + redirect : ''}">Verifica il tuo account OLAF</a>`
    }
};

// Mailing functions
function sendVerificationEmail(destination, verification, redirect, callback) {
    // Send verification mail
    transporter.sendMail(emailConfiguration(destination, verification, redirect), (err, info) => {
        if(err) console.error(err);
        callback(err, info);
    });
}

exports.sendVerificationEmail = sendVerificationEmail;