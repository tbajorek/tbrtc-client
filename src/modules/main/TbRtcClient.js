import _ from 'underscore';
import defaultConfig from './default.config';
import UserMedia from '../media/UserMedia';
import Socket from '../signaling/Socket';
import Video from '../dom/Video';
import MultiConnection from '../connection/MultiConnection';
import Constraints from '../config/Constraints';
import Information from '../media/Information';
import Devices from '../media/Devices';
import DomManager from '../dom/DomManager';

class TbRtcClient {
    constructor(userConfig = {}) {
        this.providers = {
            MediaProvider: UserMedia,
            Signaling: Socket,
            VideoElement: Video,
            Connection: MultiConnection,
            ConstraintFilter: Constraints,
            Information: Information,
            DevicesList: Devices,
        };
        this._config = _.defaults(userConfig, defaultConfig);
        this._domManager = new DomManager(this._config);
        this._localVideo = null;
        this._remoteVideo = null;
        this._init();
    }

    _init() {

    }

    start() {
        this._mediaRequest();
    }

    _mediaRequest() {
        const oldCallback = this.providers.MediaProvider.onSuccess;
        this.providers.MediaProvider.onSuccess = (stream) => {
            this._localVideo = new Video(this._domManager.localVideo, stream, { autoInit: true });
            this._domManager.localVideo.srcObject = stream.stream;
            this._localVideo.init();
            oldCallback(stream);
        }
        this.providers.MediaProvider.get(
            this.providers.ConstraintFilter.filterAll(
                this._config.mediaConstraints
            )
        );
    }

    on(moduleName, eventName, handler) {
        switch (moduleName) {
            case 'MediaProvider':
                if (eventName === 'success') {
                    this.providers.MediaProvider.onSuccess = handler;
                } else if (eventName === 'error') {
                    this.providers.MediaProvider.onError = handler;
                }
                break;
        }
    }
}

export default TbRtcClient;