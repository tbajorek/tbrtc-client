import _ from 'underscore'
import Information from './Information'
import FunctionalityNotSupported from '../../exceptions/FunctionalityNotSupported';

/**
 * Simple mechanism designed to change volume level of audio stream
 */
class Volume {
    /**
     * Initializes volume object and audio processor
     *
     * @param {Stream} stream Input stream
     */
    constructor(stream) {
        console.log(stream);
        const compatibility = Information.supported.webAudio;
        if (!compatibility.basic) {
            throw new FunctionalityNotSupported('WebAudio');
        } else if (!compatibility.createMediaStreamSource) {
            throw new FunctionalityNotSupported('WebAudio.createMediaStreamSource()');
        }

        this._audioContext = new AudioContext();
        this._input = this._audioContext.createMediaStreamSource(stream.stream);
        this._gainNode = this._audioContext.createGain();
        this._processor = this._audioContext.createScriptProcessor(2048);
        this._stopped = false;
        this._value = 0;
        this._clipped = false;
        this._lastClip = 0;
        this._muted = false;
        this._muteMemory = this._gainNode.gain.value;

        this._input.connect(this._gainNode);
        this._gainNode.connect(this._processor);
        this._processor.connect(this._audioContext.destination);

        this._processor.addEventListener('audioprocess', this._onAudioProcessHandler.bind(this));
    }

    /**
     * Value of volume level
     *
     * @readonly
     * @property
     * @type {number}
     */
    get value() {
        return this._value;
    }

    /**
     * Setter of volume level
     *
     * @param {number} v Value of new volume lever
     */
    set level(v) {
        this._gainNode.gain.value = v * v;
    }

    /**
     * Flag if audio is clipped
     *
     * @readonly
     * @property
     * @type {boolean}
     */
    get clipped() {
        return this._clipped;
    }

    /**
     * Flag if Web Audio mechanism is stopped
     *
     * @readonly
     * @property
     * @type {boolean}
     */
    get stopped() {
        return this._stopped;
    }

    /**
     * It stops Web Audio mechanism
     */
    stop() {
        this._stopped = true;
        this._input.disconnect();
        this._gainNode.disconnect();
        this._processor.disconnect();
        this._lastClip = 0;
        this._processor.removeEventListener('audioprocess', this._onAudioProcessHandler.bind(this));
    }

    /**
     * It mutes audio stream
     */
    mute() {
        if (!this._muted) {
            this._muteMemory = this._gainNode.gain.value;
            this._gainNode.gain.value = 0;
            this._muted = true;
        }
    }

    /**
     * It reverts 'mute' operation if it's done
     */
    unmute() {
        if (this._muted) {
            this._gainNode.gain.value = this._muteMemory;
            this._muted = false;
        }
    }

    /**
     * Flag if volume is muted
     *
     * @readonly
     * @property
     * @type {boolean}
     */
    get muted() {
        return this._muted;
    }

    /**
     * Handler to be fired by event which input buffer of Web Audio mechanism is ready to be processed
     *
     * @param {AudioProcessingEvent} event Data of event
     * @private
     */
    _onAudioProcessHandler(event) {
        const averageFactor = 0.95;
        const clipLevel = 0.98;
        const clippingTime = 800;

        const values = event.inputBuffer.getChannelData(0);
        const currentValue = Math.sqrt(_.reduce(values, (memory, value) => {
            return memory + value * value;
        }, 0) / values.length);
        this._value = Math.max(currentValue,this._value * averageFactor);
        let maxVal = _.max(values, (value) => {
            return Math.abs(value);
        });
        if (maxVal >= clipLevel || (this._lastClip + clippingTime) < window.performance.now()) {
            this._clipped = true;
            this._lastClip = window.performance.now();
        } else {
            this._clipped = false;
        }
    }
}

export default Volume;