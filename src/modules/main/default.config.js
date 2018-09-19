export default {
    localVideo: '#localVideo',
    localVideoContainer: null,
    remoteVideo: '#remoteVideo',
    remoteVideoContainer: null,
    autoBindingMedia: true,
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
        debug: {
            recvMessages: false,
            sentMessages: false,
        }
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
        multiple: true,
        dataChannel: {
            ordered: true,
            reliable: true,
        },
        latency: 200,
    },
    currentUser: null,
    debug: false,
    displayError: (msg) => {
        console.error(msg);
    }
};