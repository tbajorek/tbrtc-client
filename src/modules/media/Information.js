import bowser from 'bowser'

const Information = {
    get isNodeJs() {
        return typeof process === 'object' && typeof process.versions === 'object' && process.versions.node;
    },
    support: {
        get createElement() {
            return !(typeof document === 'undefined' || typeof document.createElement !== 'function');
        },
        get canvasStreamCapturing() {
            if(!Information.support.createElement) {
                return false;
            }
            var result = false;
            var element = document.createElement('canvas');
            ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].every(function(option){
                if(option in element) {
                    result = true;
                    return false;
                } else {
                    return true;
                }
            });
            return result;
        },
        get videoStreamCapturing() {
            if(!Information.support.createElement) {
                return false;
            }
            var result = false;
            var element = document.createElement('video');
            ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].every(function(option){
                if(option in element) {
                    result = true;
                    return false;
                } else {
                    return true;
                }
            });
            return result;
        },
        get webRTC() {
            if(typeof window === 'undefined') {
                return false;
            }
            var result = false;
            ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].every(function(elem) {
                if (elem in window) {
                    result = true;
                    return false;
                } else {
                    return true;
                }
            });
            return result;
        },
        get oRTC() {
            return typeof RTCIceGatherer !== 'undefined';
        },
        get screenCapturing() {
            var result = bowser.check({
                "chrome": "35",
                "firefox": "34"
            });
            if (!/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
                if (bowser.chrome) {
                    result = false;
                }
                if (bowser.firefox) {
                    result = false;
                }
            }
            return result;
        },
        get webAudio() {
            var result = {
                basic: false,
                createMediaStreamSource: false
            };

            ['AudioContext', 'webkitAudioContext', 'mozAudioContext', 'msAudioContext'].every(function(elem) {
                if (elem in window) {
                    result.basic = true;

                    if (window[elem] && 'createMediaStreamSource' in window[elem].prototype) {
                        result.createMediaStreamSource = true;
                    }
                    return false;
                } else {
                    return true;
                }
            });

            return result;
        },
        get rdpDataChannel() {
            return bowser.check({
                "chrome": "32"
            });
        },
        get STCP() {
            return bowser.check({
                "chrome": "26",
                "firefox": "29",
                "opera": "11"
            });
        },
        get webSocket() {
            return 'WebSocket' in window && 1 === window.WebSocket.OPEN || Information.isNodeJs;
        },
        get rtpSenderReplaceTracks() {
            var result = false;
            var object = null;
            if(typeof RTCPeerConnection !== 'undefined') {
                object = RTCPeerConnection.prototype;
            } else if (bowser.firefox && typeof mozRTCPeerConnection !== 'undefined') {
                object = mozRTCPeerConnection.prototype;
            } else if (bowser.chrome && typeof webkitRTCPeerConnection !== 'undefined') {
                object = webkitRTCPeerConnection.prototype;
            }

            if (object !== null && 'getSenders' in object) {
                result = true;
            }
            return result;
        },
        get remoteStreamProcessing() {
            return bowser.check({
                "firefox": "39"
            });
        },
        get applyConstraints() {
            return typeof MediaStreamTrack !== 'undefined' && 'applyConstraints' in MediaStreamTrack.prototype;
        }
    }


};

export default Information;