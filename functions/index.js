const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.sendMessageNotification = functions.database.ref('/chats/{chatId}/{messageId}').onWrite(event => {

    const chatId = event.params.chatId;
    const messageId = event.params.messageId;
    const msg = event.data.val();
    let senderId;
    let receiverId;
    const uids = chatId.split(",");

    if (msg.from == uids[0]) {
        senderId = uids[0];
        receiverId = uids[1];
    } else {
        senderId = uids[1];
        receiverId = uids[0];
    }

    return admin.database().ref(`/user/${receiverId}/token`).once('value').then(snap => {
        const deviceToken = snap.val();
        if (!deviceToken) {
            return console.log('There is no device token to send notification.');
        }
        console.log('There is (', deviceToken, ') token to send notifications to.');
        const payload = {
            notification: {
                title: 'You have a new Message!',
                body: msg.message,
                icon: 'fcm_push_icon.png',
            },
            data: {
                title: 'You have a new Message!',
                message: msg.message,
                senderId: senderId,
                receiverId: receiverId
            }
        };
        return admin.messaging().sendToDevice(deviceToken, payload).then(response => {
            console.log('response under sendToDevice: ', JSON.stringify(response));
        });
    });

});