import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import Finder from './Finder';
import Video from './Video';

class DomManager {
    constructor(config) {
        this._config = Object.assign({}, config);
        this._findVideo('local');
        this._findVideo('remote');
    }

    _findVideo(type) {
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
        }
        if (found === null) {
            found = Video.createVideo(type);
        }
        this._config[type + 'VideoContainer'] = container;
        this._config[type + 'Video'] = found;
    }

    get localVideoContainer() {
        return this._config.localVideoContainer;
    }

    get localVideo() {
        return this._config.localVideo;
    }

    get remoteVideoContainer() {
        return this._config.localVideoContainer;
    }

    get remoteVideo() {
        return this._config.remoteVideo;
    }

    cloneVideo(type) {
        ValueChecker.check({ type }, {
            "type": {
                "typeof": 'string',
                "inside": ['local', 'remote'],
            }
        });
        const clonedElement = type ? 'local' : this.config
    }
}

export default DomManager;