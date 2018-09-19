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

// Translation.instance.setLocale('pl_PL');

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

window.tbRtcClient = new TbRtcClient({
    signaling: {
        server: 'ws://0.0.0.0:9876'
    },
    peerConfig: {
        iceServers: [
            {
                "urls": [
                    "stun:stun.l.google.com:19302"
                ]
            }
        ]
    },
    //autoBindingMedia: false,
    //debug: true
});

const connect = () => {
    loginButton.disabled = true;
    currentUsernameInput.disabled = true;
    currentEmailInput.disabled = true;
    newSessionButton.disabled = false;
    sessionIdInput.disabled = false;
    joinSessionButton.disabled = false;
    logoutButton.disabled = false;
    stopRequestButton.disabled = false;
};

const disconnect = () => {
    loginButton.disabled = false;
    currentUsernameInput.disabled = false;
    currentEmailInput.disabled = false;
    newSessionButton.disabled = true;
    sessionIdInput.disabled = true;
    joinSessionButton.disabled = true;
    logoutButton.disabled = true;

};

const newRequest = (username) => {
    acceptedUsername.disabled = false;
    acceptedUsername.value = username;
    acceptButton.disabled = false;
    rejectButton.disabled = false;
};

const cleanRequest = () => {
    acceptedUsername.value = '';
    acceptedUsername.disabled = true;
    acceptButton.disabled = true;
    rejectButton.disabled = true;
};

const sessionActive = () => {
    stopRequestButton.disabled = true;
    messageButton.disabled = false;
    leaveButton.disabled = false;
    fileInput.disabled = false;
};

const sessionInactive = () => {
    messageButton.disabled = true;
    leaveButton.disabled = true;
    closeButton.disabled = true;
    fileInput.disabled = true;
};

const initializeFileInput = (fileInput) => {
    const file = tbRtcClient.addFileInput(fileInput);
    file.on('file.chosen', (event) => {
        //tbRtcClient.sendFiles(event.data.files);
    });
};

tbRtcClient.isAnyError(error => {
    console.error(error.toString());
});

tbRtcClient.isConnected(() => {
    console.log(tbRtcClient.currentUser);
    connect();
});
tbRtcClient.isNewSession((sessionId) => {
    closeButton.disabled = false;
    sessionIdText.innerHTML = sessionId;
    sessionActive();
});
tbRtcClient.isJoined((session) => {
    sessionIdText.innerHTML = session.id;
    sessionActive();
});

tbRtcClient.isNewUser((user) => {
    console.log('user '+user.name+' joined to this session');
});

tbRtcClient.isRejectedMe((data) => {
    console.log('you are rejected by member ' + data.decidedBy.name + ' of the session ' + data.sessionId);
});

tbRtcClient.isRejected((data) => {
    cleanRequest();
});


tbRtcClient.isRequest((request) => {
    newRequest(request.requestMessage.user.name);
    acceptButton.onclick = (e) => {
        cleanRequest();
        request.confirm();
    };
    rejectButton.onclick = (e) => {
        cleanRequest();
        request.reject();
    };
});

tbRtcClient.isRequestStopped(() => {
    cleanRequest();
    console.log('request stopped');
});

tbRtcClient.isNewChatMessage((message) => {
    chat.innerHTML += '(' + message.date+') '+message.user.name+': '+message.content+'\n';
});

tbRtcClient.isSessionUnavailable(() => {
    sessionInactive();
    sessionIdText.innerHTML = '';
});

tbRtcClient.isSessionUserLeft(({session, user}) => {
    console.log('user '+user.name+' left the session');
});

tbRtcClient.isSessionClosed(() => {
    console.log('session.closed');
    closeButton.disabled = true;
});

tbRtcClient.isDisconnected(() => {
    console.log('disconnected');
    disconnect();
});

tbRtcClient.isP2pStateChange((e) => {
    console.log('state change', e);
    disconnect();
});

tbRtcClient.isFileTransferStart(event => {
    console.log('file started', event);
});

tbRtcClient.isFileTransferProgress(event => {
    //console.log('file updated', event.data.currentChunk);
    console.log('file updated');
});

tbRtcClient.isFileReceived(event => {
    logsText.innerHTML += 'Received file '+event.file.info.name+' ('+event.file.readableSize + ')'+'<br />';
    console.log('file received', event);
    event.file.download();
});

tbRtcClient.isFileSent(event => {
    logsText.innerHTML += 'Sent file '+event.file.info.name+' ('+event.file.readableSize + ')'+'<br />';
    console.log('file sent', event);
});

tbRtcClient.isUserCommunication((data) => {
    console.log('user communication', data);
    if(data.details.task === 'session.join.ask') {
        sessionIdInput.value = data.details.sessionId;
    }
});
tbRtcClient.isInitialized(() => {console.log('initialized');
    initializeFileInput(fileInput);


    /*tbRtcClient.on('MediaProvider', 'success', () => alert('success'));
    tbRtcClient.on('MediaProvider', 'error', () => alert('error'));*/
    loginButton.addEventListener('click', () => {
        const userModel = new UserModel(null, currentUsernameInput.value, currentSurnameInput.value, currentEmailInput.value, 'https://avatarmaker.com/svgavatars/temp-avatars/svgA6119304512517854.png');
        //const userModel = new UserModel('4623fe47-a67e-4c64-bc9f-7211285a8b12', currentUsernameInput.value, currentSurnameInput.value, currentEmailInput.value, 'https://avatarmaker.com/svgavatars/temp-avatars/svgA6119304512517854.png');
        userModel.originalId = uuidv4();
        tbRtcClient.setCurrentUser(userModel);
        console.log(userModel);
        console.log(tbRtcClient.currentUser);
        tbRtcClient.start({
            audio: audioType.checked,
            video: videoType.checked,
        });
    });

    newSessionButton.addEventListener('click', () => {
        tbRtcClient.startSession();
    });

    joinSessionButton.addEventListener('click', () => {
        tbRtcClient.joinSession(sessionIdInput.value);
    });

    stopRequestButton.addEventListener('click', () => {
        tbRtcClient.stopRequest(sessionIdInput.value);
    });

    messageButton.addEventListener('click', () => {
        tbRtcClient.sendChatMessage(messageText.value);
        messageText.value = '';
    });

    leaveButton.addEventListener('click', () => {
        tbRtcClient.leaveSession();
    });

    closeButton.addEventListener('click', () => {
        tbRtcClient.closeSession();
    });

    logoutButton.addEventListener('click', () => {
        tbRtcClient.disconnect();
    });

    communicationButton.addEventListener('click', () => {
        tbRtcClient.sendDataToUser(JSON.parse(communicationData.value), targetUserId.value);
    });
});