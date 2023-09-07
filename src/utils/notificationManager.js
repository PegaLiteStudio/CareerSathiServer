const axios = require('axios');

const sendNotification = (to, title, body) => {

    if (to === "all") {
        to = "app"
    }

    if (to.includes("@gmail.com")) {
        to = to.replace("@gmail.com", "")
    }

    const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';

    const headers = {
        'Authorization': `key=AAAAQH8JUrE:APA91bES_ix1Rp2JDWHQ9uGHv5BbOcQGI_3Aa2uXlzhhqKEuAWkBIf1UV_QtYrXp6CAT3QLT7Qk_16H1WAx1Bs9Clqr-M7Ece6m_LaOFC23UB6vPs-5aezWd2fibkTv_2yMTVukmmTZz`,
        'Content-Type': 'application/json'
    };

    const message = {
        to: `/topics/${to}`,
        priority: 'high',
        notification: {
            title,
            body
        },
        data: {
            icon: "app_icon",
            sound: "default",
            color: "#bb2231"
        }
    };

    axios.post(fcmEndpoint, message, {headers}).then(response => {
        console.log('Notification sent successfully:', response.data);
    }).catch(error => {
        console.error('Error sending notification:', error.message);
    });

}


module.exports = {
    sendNotification
}