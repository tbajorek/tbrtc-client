import adapter from 'webrtc-adapter'
import Translation from 'tbrtc-common/translate/Translation';
import UserMedia from './modules/media/UserMedia'
import Compatibility from './modules/utilities/Compatibility'
import Constraints from './modules/config/Constraints'
import Stream from './modules/media/Stream'

import Message from 'tbrtc-common/messages/Message'

import Socket from './modules/signaling/Socket';
import { User as UserModel } from 'tbrtc-common/model/User';
import TbRtcClient from './modules/main/TbRtcClient';

const uuidv4 = require('uuid');

Translation.instance.setLocale('pl_PL');

/*UserMedia.onSuccess = function(stream) {
    console.log('OK');
    window.stream = stream;
};
UserMedia.get([
    Constraints.Audio,Constraints.Video,Constraints.Screen
]);

new Message();*/

/*
WebRTC only signaling example
 */
/*const socket = new Socket({
    server: 'ws://0.0.0.0:9876'
});

const userModel = new UserModel(null, currentUsernameInput.value, currentEmailInput.value);
userModel.originalId = uuidv4();
loginButton.addEventListener('click', () => {
    socket.initConnection(userModel);
});

socket.on('result.success', (e) => {
    const { message } = e.data;
    console.log('SUCCESS! '+message.content);
});
socket.on('result.error', (e) => {
    const { message } = e.data;
    console.log('ERROR! '+message.content);
});
socket.on('session.created', (e) => {
    const { sessionId } = e.data;
    console.log('Session '+sessionId+" is created");
});
socket.on('session.requested', (e) => {
    const { request } = e.data;
    if(window.confirm(request.requestMessage.user.name + ' wants to join the session. Do you accept it?')) {
        request.confirm();
    } else {
        request.reject();
    }
});

newSessionButton.addEventListener('click', () => {
    socket.createNewSession();
});
joinSessionButton.addEventListener('click', () => {
    socket.joinSession(sessionIdInput.value);
});
*/

const tbRtcClient = new TbRtcClient({
    mediaConstraints: {
        audio: true,
        video: true,
    }
});
/*tbRtcClient.on('MediaProvider', 'success', () => alert('success'));
tbRtcClient.on('MediaProvider', 'error', () => alert('error'));*/
tbRtcClient.start();