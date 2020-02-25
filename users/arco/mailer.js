const nodemailer = require('nodemailer');

// Store GMAIL auth
let gmailAuth = {
    user: 'olaf@synapta.it',
    password: 'sosvwwkejzqikprg'
};

// Initializer transporter
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    auth: gmailAuth
});

// Verification email configuration
let emailConfiguration = (destination, verification) => {
    return {
        from: 'olaf@synapta.io',
        to: destination,
        subject: 'Conferma la tua email',
        html: `<a href="${verification}">Verifica il tuo account OLAF</a>`
    }
};

// Mailing functions
function sendVerificationEmail(destination, verification, callback) {
    // Send verification mail
    transporter.sendMail(emailConfiguration(destination, verification), (err, info) => {
        if(err) console.error(err);
        callback(err, info);
    });
}

exports.sendVerificationEmail = sendVerificationEmail;