import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import Finder from './Finder';
import Video from './MediaElement';

/**
 * Manager of DOM elements for WebRTC communication
 */
class DomManager {
    /**
     * Initialization of the manager
     *
     * @param {object} config Configuration object
     */
    constructor(config) {
        this._config = Object.assign({}, config);
        this.findVideo('local');
        this.findVideo('remote');
    }

    /**
     * Find video with the given type based on configuration
     *
     * @param {string} type One of video element types: 'local' or 'remote'
     * @private
     */
    findVideo(type) {
        let container = document,
        found = null;
        if (this._config[type + 'VideoContainer'] instanceof Element) {
            container = this._config[type + 'VideoContainer'];
        } else if (typeof this._config[type + 'VideoContainer'] === 'string') {
            try {
                container = Finder.find(this._config[type + 'VideoContainer']);
            } catch (e) {}
        }

        if (this._config[type + 'Video'] instanceof Element) {
            found = this._config[type + 'Video'];
        } else if (typeof this._config[type + 'Video'] === 'string') {
            try {
                found = Finder.find(this._config[type + 'Video'], container, true);
            } catch (e) {}
            if(found === null) {
                try {
                    found = Finder.find('video', container, true);
                } catch (e) {}
            }
        }
        if (found === null) {
            //found = Video.createVideo(type);
        }
        this._config[type + 'VideoContainer'] = container;
        this._config[type + 'Video'] = found;
    }

    /**
     * It sets the passed video element as local or remote
     *
     * @param {string} type Type of video: local or remote
     * @param {HTMLVideoElement} videoElement Video element
     */
    setVideo(type, videoElement) {
        ValueChecker.check({ type, videoElement }, {
            "type": {
                "typeof": 'string',
                "inside": ['local', 'remote'],
            },
            "videoElement": {
                "required": true,
                "typeof": "object",
                "instanceof": HTMLVideoElement
            }
        });
        this._config[type + 'Video'] = videoElement;
    }

    /**
     * DOM element which contains local video
     *
     * @readonly
     * @type {Element}
     */
    get localVideoContainer() {
        return this._config.localVideoContainer;
    }

    /**
     * Local video DOM element
     *
     * @readonly
     * @type {Element}
     */
    get localVideo() {
        return this._config.localVideo;
    }

    /**
     * DOM element which contains remote video
     *
     * @readonly
     * @type {Element}
     */
    get remoteVideoContainer() {
        return this._config.remoteVideoContainer;
    }

    /**
     * Remote video DOM element
     *
     * @readonly
     * @type {Element}
     */
    get remoteVideo() {
        return this._config.remoteVideo;
    }

    /**
     * It clones video according to the given type and returns new DOM element
     *
     * @param type
     * @returns {Node}
     */
    cloneVideo(type) {
        ValueChecker.check({ type }, {
            "type": {
                "typeof": 'string',
                "inside": ['local', 'remote'],
            }
        });
        const baseElement = type === 'local' ? this.localVideo : this.remoteVideo;
        const clonedElement = baseElement.cloneNode(true);
        return clonedElement;
    }
}

export default DomManager;