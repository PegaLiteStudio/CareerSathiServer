const fs = require('fs');
const path = require('path');

// Generate a random OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create OTP data
const otp = generateOTP();
const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

const otpData = {
    otp: otp,
    expiration: expirationTime.toISOString()
};

// Save OTP data to a JSON file
const otpFilePath = path.join(__dirname, 'otp_data.json');

// fs.writeFile(otpFilePath, JSON.stringify(otpData, null, 2), err => {
//     if (err) {
//         console.error('Error saving OTP data:', err);
//     } else {
//         console.log('OTP data saved to otp_data.json');
//     }
// });

console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Kolkata'}))
const now = new Date();
const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit' };
const formattedDate = now.toLocaleDateString('en-US', options);


console.log(formattedDate);
