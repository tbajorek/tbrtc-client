import _ from 'underscore';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import FunctionalityNotSupported from '../../exceptions/FunctionalityNotSupported'
import Stream from '../media/Stream'

class Video {
    /**
     * 
     * @param {Element} domElement Dom object representing video element
     * @param {Stream} stream Stream wrapper
     * @param {object} config Configuration object with initial parameters given to the original video element
     */
    constructor(domElement, stream, config = null) {
        this._onLoad = (e) => {

        };
        if (domElement === null && typeof document !== 'undefined' && typeof document.createElement !== 'undefined') {
            domElement = document.createElement('video');
        } else if (typeof domElement !== 'object' ||
            typeof domElement.tagName === 'undefined' ||
            !((Array.isArray(stream.audio.tracks) && domElement.tagName.toLowerCase() == 'audio') || domElement.tagName.toLowerCase() === 'video')
        ) {
            throw new BadParamType('domElement', 'constructor', 'video DOM');
        }
        this._domElement = domElement;
        if (!(stream instanceof Stream)) {
            throw new BadParamType('stream', 'constructor', 'media/Stream');
        }
        this._stream = stream;
        if (typeof config !== 'object') {
            throw new BadParamType('config', 'constructor', 'object');
        }
        this._config = config;
        if (this._config !== null && typeof this._config.autoInit !== 'undefined' && this._config.autoInit === true) {
            this.init();
        }
    }

    set onLoad(handler) {
        this._onLoad = handler;
    }

    /**
     * It creates stream on video element
     */
    createStream() {
        if (!this._domElement.createStream) {
            throw new FunctionalityNotSupported('video.createStream()');
        }
        return this._domElement.createStream();
    }

    /**
     * It initializes video element with parameters given in config object
     */
    init() {
        this._domElement.onloadedmetadata = (e) => {
            this.play();
            this._onLoad(e);
        }
        this._domElement.srcObject = this._stream.stream;
        if (this._config !== null && typeof this._config.properties !== 'undefined') {
            _.each(this._config.properties, (value, key) => this._domElement[key] = value);
        }
        return this;
    }

    play() {
        this._domElement.play();
        return this;
    }

    stop() {
        this._domElement.pause();
        return this;
    }

    /**
     * Getter for original video element
     * @returns {Element}
     */
    get domElement() {
        return this._domElement;
    }

    /**
     * It creates video DOM element according to the given type
     * 
     * @param {string} type Type of video ('local' or 'remote')
     * @returns {Element}
     */
    static createVideo(type) {
        ValueChecker.check({ type }, {
            "type": {
                "typeof": 'string',
                "inside": ['local', 'remote'],
            }
        });
        const element = document.createElement('video');
        element.className = type + 'Video';
        element.setAttribute('autoplay', true);
        if (type === 'local') {
            element.setAttribute('muted', true);
        }
        return element;
    }
}

export default Video;