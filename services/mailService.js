const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',  // Or any other service you're using
    auth: {
        user: 'nutriquest96@gmail.com', // Use email from .env
        pass: 'nsjustljcirkuqcq'  // Use password from .env
    }
});

const sendReportEmail = (email, reportContent) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Daily Activity Report',
        text: reportContent
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendReportEmail;
