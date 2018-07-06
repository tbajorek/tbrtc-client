import bowser from 'bowser'

/**
 * This object contains information about WebRTC technology available in a concrete browser.
 * It provices information eg. about supported features of WebRTC standard.
 *
 * @readonly
 * @type {object}
 */
const Information = {
    /**
     * Flag if the environment is nodeJS
     *
     * @readonly
     * @typeof {boolean}
     */
    get isNodeJs() {
        return typeof process === 'object' && typeof process.versions === 'object' && process.versions.node;
    },
    /**
     * Information which features of WebRTC are supported in a browser
     *
     * @readonly
     * @type {object}
     */
    supported: {
        /**
         * If document,createElement() method is supported
         *
         * @readonly
         * @type {boolean}
         */
        get createElement() {
            return !(typeof document === 'undefined' || typeof document.createElement !== 'function');
        },
        /**
         * If stream capturing is supported in Canvas element
         *
         * @readonly
         * @type {boolean}
         */
        get canvasStreamCapturing() {
            if(!Information.supported.createElement) {
                return false;
            }
            let result = false;
            const element = document.createElement('canvas');
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
        /**
         * If stream capturing is supported in video element
         *
         * @readonly
         * @type {boolean}
         */
        get videoStreamCapturing() {
            if(!Information.supported.createElement) {
                return false;
            }
            let result = false;
            const element = document.createElement('video');
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
        /**
         * If basic functionality of WebRTC (RTCPeerConnection) is supported
         *
         * @readonly
         * @type {boolean}
         */
        get webRTC() {
            if(typeof window === 'undefined') {
                return false;
            }
            let result = false;
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
        /**
         * If oRTC technology is supported
         *
         * @readonly
         * @type {boolean}
         */
        get oRTC() {
            return typeof RTCIceGatherer !== 'undefined';
        },
        /**
         * If screen capturing is supported
         *
         * @readonly
         * @type {boolean}
         */
        get screenCapturing() {
            let result = bowser.check({
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
        /**
         * If Web Audio interface is supported
         *
         * @readonly
         * @type {object}
         */
        get webAudio() {
            const result = {
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
        /**
         * If RTP protocol is supported
         *
         * @readonly
         * @type {boolean}
         */
        get rtp() {
            return bowser.check({
                "chrome": "32"
            });
        },
        /**
         * If STCP protocol is supported
         *
         * @readonly
         * @type {boolean}
         */
        get sctp() {
            return bowser.check({
                "chrome": "26",
                "firefox": "29",
                "opera": "11"
            });
        },
        /**
         * If WebSocket technology is supported
         *
         * @readonly
         * @type {boolean}
         */
        get webSocket() {
            return 'WebSocket' in window && 1 === window.WebSocket.OPEN || Information.isNodeJs;
        },
        /**
         * If RTC sender can replace tracks without renegotiating peer connection
         *
         * @readonly
         * @type {boolean}
         */
        get rtpSenderReplaceTracks() {
            let result = false;
            let object = null;
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
        /**
         * IF recording or processing remote audio can be done in WebAudio API
         *
         * @readonly
         * @type {boolean}
         */
        get remoteStreamProcessing() {
            return bowser.check({
                "firefox": "39"
            });
        },
        /**
         * If MediaStreamTrack.applyConstraints() method is supported
         *
         * @readonly
         * @type {boolean}
         */
        get applyConstraints() {
            return typeof MediaStreamTrack !== 'undefined' && 'applyConstraints' in MediaStreamTrack.prototype;
        }
    }

};

export default Information;