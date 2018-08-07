export default {
    localVideo: '#localVideo',
    localVideoContainer: null,
    remoteVideo: '#remoteVideo',
    remoteVideoContainer: null,
    locale: 'pl_PL',
    offerOptions: {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    },
    mediaConstraints: {
        video: false,
        audio: false,
    },
    signaling: {
        server: null,
        autoConnection: true,
    },
    peerConfig: {
        iceServers: []
    },
    filesConfig: {
        enabled: true,
        emptyFiles: true,
        maxChunkSize: 16384,
        hideInput: false,
        autoSending: true,
        acceptedTypes: null,
        dataChannel: {
            ordered: true,
            reliable: true,
        },
    },
    currentUser: null,
    debug: false,
    displayError: (msg) => {
        console.error(msg);
    }
};