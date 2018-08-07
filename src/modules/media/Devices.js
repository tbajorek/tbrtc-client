import bowser from 'bowser'
import Information from './Information'
import Translation from 'tbrtc-common/translate/Translation';

/**
 * Object with basic set of functionality to enumerate available devices and check its permissions
 *
 * @readonly
 * @type {object}
 */
const Devices = {
    /**
     * List of all available devices
     *
     * @type {object|null}
     */
    _list: null,
    /**
     * Flag if warnings should be shown
     *
     * @type {boolean}
     */
    showWarnings: true,
    /**
     * List of all available devices if browser allows to do it. It's a property which is calculated while the first use.
     *
     * @readonly
     * @type {object|null}
     */
    get list() {
        if(!this.canEnumerate()) {
            return null;
        }
        if(this._list === null) {
            const context = this;
            this.load(function(devices){
                context._list = devices;
            });
        }
        return this._list;
    },
    /**
     * It prepares device list
     *
     * @param {function|null} callback Callback to be executed when device list is created.
     * It's argument is list with enumerated devices.
     */
    load(callback = null, error = this._errorLoad) {
        this._enumerateDevices(callback, error);
    },
    /**
     * List of audio input devices
     *
     * @readonly
     * @type {object[]|null}
     */
    get microphone() {
        return this._list | this._list.audioInput;
    },
    /**
     * List of audio output devices
     *
     * @readonly
     * @type {object[]|null}
     */
    get speakers() {
        return this._list | this._list.audioOutput;
    },
    /**
     * List of camera devices
     *
     * @readonly
     * @type {object[]|null}
     */
    get webcam() {
        return this._list | this._list.videoInput;
    },
    _webcamPermission: false,
    /**
     * Flag if webcam device has already granted permissions
     *
     * @readonly
     * @type  {boolean}
     */
    get webcamPermissions() {
        return this._webcamPermission;
    },
    _microphonePermission: false,
    /**
     * Flag if audio input device has already granted permissions
     *
     * @readonly
     * @type  {boolean}
     */
    get microphonePermissions() {
        return this._microphonePermission;
    },
    /**
     * It checks if browser allows to enumerate all available devices
     *
     * @returns {boolean}
     */
    canEnumerate() {
        return navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices;
    },
    _errorLoad(e) {
        console.error('EnumDevicesError: '+e.message);
    },
    /**
     * It enumerates all available devices. It's asynchronous method.
     * Result is assigned to a property and also passed to the given callback.
     *
     * @param {function} callback Callback where is passed result
     * @param {function} error Callback where is passed result
     * @private
     */
    _enumerateDevices(callback = null, error = this._errorLoad) {
        const devices = {
            "audioInput": [],
            "audioOutput": [],
            "videoInput": []
        };
        let microphone = false, webcam = false;
        const context = this;
        navigator.mediaDevices.enumerateDevices().then(function(allDevices){
            allDevices.forEach(function(device){
                // Before request for user media labels of devices are not available
                if (!device.label && context.showWarnings) {
                    console.warn(
                        Translation.instance._('Label of device {device} is unavailable for now. Please request for user media first.', {
                            "device": device.id
                        })
                    );
                    // For Chrome since browser version 46 if the source of site is not localhost, you need to provide HTTPS connection
                    if (bowser.chrome && bowser.version >= 46 && !/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
                        if (typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1  && context.showWarnings) {
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
            context._microphonePermission = microphone;
            context._webcamPermission = webcam;
            if(typeof callback === 'function') {
                callback(devices);
            }
        }).catch(error);
    }
};

export default Devices;