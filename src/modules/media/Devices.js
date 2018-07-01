import bowser from 'bowser'
import Information from './Information'
import Translation from 'tbrtc-common/translate/Translation';

const Devices = {
    _list: null,
    get list() {
        if(!this.canEnumerate()) {
            return null;
        }
        if(this._list === null) {
            var context = this;
            this._enumerateDevices(function(devices){
                context._list = devices;
            });
        }
        return this._list;
    },
    load(callback = null) {
        this._enumerateDevices(callback);
    },
    get microphone() {
        return this._list | this._list.audioInput;
    },
    get speakers() {
        return this._list | this._list.audioOutput;
    },
    get webcam() {
        return this._list | this._list.videoInput;
    },
    _webcamPermission: false,
    get webcamPermission() {
        return this._webcamPermission;
    },
    _microphonePermission: false,
    get microphonePermission() {
        return this._microphonePermission;
    },
    canEnumerate() {
        return navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices;
    },
    _enumerateDevices(callback = null) {
        var devices = {
            "audioInput": [],
            "audioOutput": [],
            "videoInput": []
        };
        var microphone = false, webcam = false;
        navigator.mediaDevices.enumerateDevices().then(function(allDevices){
            allDevices.forEach(function(device){
                if (!device.label) {
                    console.warn(
                        Translation.instance._('Label of device {device} is unavailable for now. Please request for user media first.', {
                            "device": device.id
                        })
                    );
                    if (bowser.chrome && bowser.version >= 46 && !/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
                        if (typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1) {
                            console.warn(
                                Translation.instance._('You need safe HTTPS protocols to read label of this device {device}', {
                                    "device": device.id
                                })
                            );
                        }
                    }
                } else {
                    if (device.kind === 'audioinput') {
                        microphone = true;
                    }

                    if (device.kind === 'videoinput') {
                        webcam = true;
                    }
                }

                if (device.kind === 'audioinput') {
                    if (devices.audioInput.indexOf(device) === -1) {
                        devices.audioInput[devices.audioInput.length] = device;
                    }
                } else if (device.kind === 'audiooutput') {
                    if (devices.audioOutput.indexOf(device) === -1) {
                        devices.audioOutput[devices.audioOutput.length] = device;
                    }
                } else if (device.kind === 'videoinput') {
                    if (devices.videoInput.indexOf(device) === -1) {
                        devices.videoInput[devices.videoInput.length] = device;
                    }
                }
            });
        });
        this._microphonePermission = microphone;
        this._webcamPermission = webcam;
        if(typeof callback === 'function') {
            callback(devices);
        }
    }
};

export default Devices;