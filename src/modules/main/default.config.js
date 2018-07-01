export default {
    localVideo: '#localVideo',
    localVideoContainer: null,
    remoteVideo: '#remoteVideo',
    remoteVideoContainer: null,
    iceServers: [],
    offerOptions: {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    },
    mediaConstraints: {
        video: false,
        audio: false,
    }
};