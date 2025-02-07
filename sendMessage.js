// sendMessages.js or inside server.js

const twilio = require('twilio');
const UserInfoModel = require('./models/UserInfoModel'); // Import your model

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Twilio Auth Token
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number

const client = twilio(accountSid, authToken);

const sendMessageToAllUsers = async (message) => {
    try {
        // Fetch all users with contact numbers
        const users = await UserInfoModel.find({ contactNumber: { $exists: true, $ne: null } });

        // Send a message to each user
        for (const user of users) {
            // Assuming the contact number is an Indian number, prepend +91
            const formattedNumber = `+91${user.contactNumber}`;

            await client.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: formattedNumber, // Use the formatted number
            });
            console.log(`Message sent to ${formattedNumber}`);
        }
    } catch (error) {
        console.error('Error sending messages:', error);
    }
};

module.exports = sendMessageToAllUsers;
