import _ from 'underscore';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import FunctionalityNotSupported from '../../exceptions/FunctionalityNotSupported'
import Stream from '../media/Stream'

/**
 * Class represents video element on a page. It's a wrapper which provides some basic functionality.
 */
class MediaElement {
    /**
     * Initialization of video element
     *
     * @param {HTMLMediaElement} domElement Dom object representing video element
     * @param {Stream} stream Stream wrapper
     * @param {object} config Configuration object with initial parameters given to the original video element
     */
    constructor(domElement, stream, config = null) {
        this._initialized = false;
        this._onLoad = (e) => {};
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

    get onLoad() {
        return this._onLoad;
    }

    /**
     * It captures stream from DOM media element
     *
     * @returns {MediaStream}
     */
    captureStream() {
        if (!this._domElement.captureStream) {
            throw new FunctionalityNotSupported('{MediaHTMLElement}.captureStream()');
        }
        return this._domElement.captureStream();
    }

    /**
     * It initializes video element with parameters given in config object
     */
    init() {
        if(!this._initialized) {
            this._domElement.onloadedmetadata = (e) => {
                this.play();
                this._onLoad(e);
            };
            this._domElement.srcObject = this._stream.stream;
            if (this._config !== null && typeof this._config.properties !== 'undefined') {
                _.each(this._config.properties, (value, key) => this._domElement[key] = value);
            }
            this._initialized = true;
        }
        return this;
    }

    /**
     * It starts to play the video
     *
     * @returns {MediaElement}
     */
    play() {
        this._domElement.play();
        return this;
    }

    /**
     * It stops to play the video
     *
     * @returns {MediaElement}
     */
    stop() {
        this._domElement.pause();
        return this;
    }

    /**
     * Original audio or video DOM element
     *
     * @property
     * @readonly
     * @type {HTMLAudioElement|HTMLVideoElement}
     */
    get domElement() {
        return this._domElement;
    }

    /**
     * Source stream object
     *
     * @property
     * @readonly
     * @type {Stream}
     */
    get stream() {
        return this._stream;
    }

    /**
     * It creates video DOM element according to the given type
     * 
     * @param {string} type Type of video ('local' or 'remote')
     * @returns {HTMLVideoElemen}
     */
    static createVideo(type) {
        return MediaElement._createElement('video', type);
    }

    /**
     * It creates audio DOM element according to the given type
     *
     * @param {string} type Type of audio ('local' or 'remote')
     * @returns {HTMLAudioElement}
     */
    static createAudio(type) {
        return MediaElement._createElement('audio', type);
    }

    /**
     * It creates media element for local or remote data
     *
     * @param {string} tag Tag name: 'audio' or 'video'
     * @param {string} type Type of media: 'local' or 'remote'
     * @returns {HTMLAudioElement|HTMLVideoElement}
     * @private
     */
    static _createElement(tag, type) {
        ValueChecker.check({ tag, type }, {
            "tag": {
                "typeof": 'string',
                "inside": ['audio', 'video'],
            },
            "type": {
                "typeof": 'string',
                "inside": ['local', 'remote'],
            }
        });
        const element = document.createElement(tag);
        element.className = type + 'Video';
        element.setAttribute('autoplay', true);
        if (type === 'local') {
            element.setAttribute('muted', true);
        }
        return element;
    }
}

export default MediaElement;