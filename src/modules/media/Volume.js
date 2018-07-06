import _ from 'underscore'
import Information from './Information'
import FunctionalityNotSupported from '../../exceptions/FunctionalityNotSupported';

class Volume
{
    constructor(stream) {
        const compatibility = Information.support.webAudio;
        if(!compatibility.basic) {
            throw new FunctionalityNotSupported('WebAudio');
        } else if(!compatibility.createMediaStreamSource) {
            throw new FunctionalityNotSupported('WebAudio.createMediaStreamSource()');
        }

        this._audioContext = new AudioContext();
        this._input = this._audioContext.createMediaStreamSource(stream);
        this._gainNode = this._audioContext.createGain();
        this._processor = this._audioContext.createScriptProcessor(2048);
        this._stopped = false;
        this._value = 0;
        this._clipped = false;
        this._muted = false;
        this._muteMemory = this._gainNode.gain.value;

        this._input.connect(this._gainNode);
        this._gainNode.connect(this._processor);
        this._processor.connect(this._audioContext.destination);

        var context = this;
        var averageFactor = 0.95;
        var clipLevel = 0.98;
        var clippingTime = 800;
        var lastClip = 0;
        this._processor.onaudioprocess = function(event) {
            var values = event.inputBuffer.getChannelData(0);
            var currentValue = Math.sqrt(_.reduce(values, function(memory, value){ return memory + value * value; }, 0)/values.length);
            context._value = Math.max(currentValue, context._value * averageFactor);
            if(_.max(values, function(value){ return Math.abs(value); }) >= clipLevel || (lastClip + clippingTime) < window.performance.now()) {
                context._clipped = true;
                lastClip = window.performance.now();
            } else {
                context._clipped = false;
            }
        };
    }

    get value() {
        return this._value;
    }

    set level(v) {
        this._gainNode.gain.value = v * v;
    }

    get clipped() {
        return this._clipped;
    }

    get stopped() {
        return this._stopped;
    }

    stop() {
        this._stopped = true;
        this._input.disconnect();
        this._gainNode.disconnect();
        this._processor.disconnect();
        this._processor.onaudioprocess = null;
    }

    mute() {
        if(!this._muted) {
            this._muteMemory = this._gainNode.gain.value;
            this._gainNode.gain.value = 0;
            this._muted = true;
        }
    }

    unmute() {
        if(this._muted) {
            this._gainNode.gain.value = this._muteMemory;
            this._muted = false;
        }
    }

    get muted() {
        return this._muted;
    }
}

export default Volume;