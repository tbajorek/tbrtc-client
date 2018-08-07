import 'webrtc-adapter/out/adapter';
import merge from 'deepmerge';
import Translation from 'tbrtc-common/translate/Translation';
import { User as UserModel } from 'tbrtc-common/model/User';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import ModProviderNotFound from '../../exceptions/ModProviderNotFound';
import defaultConfig from './default.config';
import UserMedia from '../media/UserMedia';
import Socket from '../signaling/Socket';
import MediaElement from '../dom/MediaElement';
import MultiConnection from '../connection/MultiConnection';
import Constraints from '../config/Constraints';
import Information from '../media/Information';
import Devices from '../media/Devices';
import DomManager from '../dom/DomManager';
import Stream from "../media/Stream";
import AnyError from "./AnyError";
import RtcConnectionNotInitialized from "../../exceptions/RtcConnectionNotInitialized";
import UserIsOffline from "../../exceptions/UserIsOffline";
import UserHasSession from "../../exceptions/UserHasSession";
import MediaRequestIsDone from "../../exceptions/MediaRequestIsDone";
import FileInput from "../dom/FileInput";
import PeerConnectionNotInitialized from "../../exceptions/PeerConnectionNotInitialized";

class TbRtcClient {
    constructor(userConfig = {}) {
        this.providers = {
            MediaProvider: UserMedia,
            Signaling: Socket,
            MediaElement: MediaElement,
            Connection: MultiConnection,
            ConstraintFilter: Constraints,
            Information: Information,
            DevicesList: Devices,
        };
        this._instances = {};
        this._config = merge(defaultConfig, userConfig);
        Translation.instance.setLocale(this._config.locale);
        this._localVideo = null;
        this._remoteVideo = null;
        this._localStream = null;
        this._sessionId = null;
        this._baseHandlers = {
            onLoadLocalVideo: () => {},
            onLoadRemoteVideo: () => {},
            onConnected: (user) => {},
            onDisconnected: () => {
                this._baseHandlers.onSessionUnavailable();
            },
            onSessionAvailable: (sessionId) => {},
            onSessionCreated: (sessionId) => {
                this._initRtcConnection(sessionId);
                this._baseHandlers.onSessionAvailable(sessionId);
            },
            onSessionRequested: (request) => {},
            onSessionJoined: (session) => {
                this._initRtcConnection(session.id);
                session.members.forEach(member => {
                    if(member.id !== this._currentUser.id) {
                        this._instances.Connection.addConnection(member);
                    }
                });
                this._startRtcProcess();
                this._baseHandlers.onSessionAvailable(session.id);
            },
            onSessionNewUser: (user) => {
                this._instances.Connection.addConnection(user);
            },
            onSessionRejected: (data) => {},
            onSessionRejectedMe: (data) => {},
            onRequestStopped: (data) => {},
            onChatMessage: () => {},
            onSessionLeft: () => {
                this._closeRtcConnection();
                this._baseHandlers.onSessionUnavailable();
            },
            onSessionUserLeft: (data) => {
                this._instances.Connection.removeConnection(data.user);
            },
            onSessionClosed: () => {
                this._closeRtcConnection();
                this._baseHandlers.onSessionUnavailable();
            },
            onSessionUnavailable: () => {},
            onSuccessMessage: (e) => {},
            onErrorMessage: (e) => {},
            onFileTransferStart: (e) => {},
            onFileTransferProgress: (e) => {},
            onFileSent: (e) => {},
            onFileReceived: (e) => {}
        };
        this._onLoadLocalVideo = () => {};
        this._onLoadRemoteVideo = () => {};
        this._isInitialized = () => {};
        this._onAnyError = (error) => {};
        this._displayError = this._config.displayError;
        this._mediaRequested = false;
        this._initialized = false;
        this._observedFileInputs = {};
        this._init();
    }

    _deviceNotFoundError(dtype) {
        const message = Translation.instance._('Any device type {dtype} has not found', {
            dtype
        });
        this._displayError(message);
    }

    _initRtcConnection(sessionId) {
        this._sessionId = sessionId;
        this._instances.Connection = new this.providers.Connection(this._config, this._sessionId, this._currentUser, this._localStream);
        for(const fileInput of Object.values(this._observedFileInputs)) {
            this._instances.Connection.addFileInput(fileInput);
        }

        this.on('Connection', 'error', (event) => {
            this._onAnyError(new AnyError(event.data.error.message, 'tbrtc-client > Connection > error'))
        });

        this.on('Connection', 'ice.found', (event) => {
            this._instances.Signaling.sendIce(event.data.ice, event.data.remoteUser);
        });
        this.on('Connection', 'offer.created', (event) => {
            this._instances.Signaling.sendSdp(event.data.sdp, event.data.remoteUser);
        });
        this.on('Connection', 'answer.created', (event) => {
            this._instances.Signaling.sendSdp(event.data.sdp, event.data.remoteUser);
        });
        this.on('Connection', 'rstream.added', (event) => {
            this._remoteVideo = new MediaElement(this._domManager.remoteVideo, event.data.stream, { autoInit: true });
            this._remoteVideo.onLoad = this._onLoadLocalVideo;
            this._remoteVideo.init();
        });
        this.on('Signaling', 'ice.received', (event) => {
            this._instances.Connection.addIceCandidate(event.data.ice, event.data.ice.sender.id);
        });
        this.on('Signaling', 'sdp.received', (event) => {
            this._instances.Connection.setRemoteDescription(event.data.sdp, event.data.sdp.sender.id);
        });
        // data transfer
        this.on('Connection', 'data.error.occured', (error) => {
            this._onAnyError(new AnyError(error.message, 'tbrtc-client > Connection > data error'));
            this._baseHandlers.onFileTransferStart({...event, type: 'sent'});
        });
        this.on('Connection', 'send.file.started', (event) => {
            this._baseHandlers.onFileTransferStart({...event, type: 'sent'});
        });
        this.on('Connection', 'receive.file.started', (event) => {
            this._baseHandlers.onFileTransferStart({...event, type: 'received'});
        });
        this.on('Connection', 'send.file.updated', (event) => {
            this._baseHandlers.onFileTransferProgress({...event, type: 'sent'});
        });
        this.on('Connection', 'receive.file.updated', (event) => {
            this._baseHandlers.onFileTransferProgress({...event, type: 'received'});
        });
        this.on('Connection', 'send.file.finished', (event) => {
            this._baseHandlers.onFileSent(event);
        });
        this.on('Connection', 'receive.file.finished', (event) => {
            this._baseHandlers.onFileReceived(event);
        });
    }

    _startRtcProcess() {
        if(this._isRtcConnection()) {
            this._instances.Connection.createOffer(this._config.offerOptions);
        } else {
            this._onAnyError(new AnyError((new PeerConnectionNotInitialized()).message, 'tbrtc-client > main > error'));
        }
    }

    _closeRtcConnection() {
        if(typeof this._instances.Connection !== 'undefined' && this._isRtcConnection()) {
            this._instances.Connection.close();
            this._instances.Connection = undefined;
            this._sessionId = null;
        }
    }

    _initSignaling() {
        this._instances.Signaling = new this.providers.Signaling(this._config.signaling);
    }

    _init() {
        if(!this._isOnline()) {
            this._onAnyError(new AnyError((new UserIsOffline()).message, 'tbrtc-client > main > error'));
        }
        this.providers.MediaProvider.debug = this._config.debug;
        this.providers.DevicesList.showWarnings = this._config.debug;
        this.providers.DevicesList.load(devices => {
            if(typeof this._config.mediaConstraints.video !== 'undefined' && !devices.videoInput.length) {
                this._deviceNotFoundError('video');
            }
            if(typeof this._config.mediaConstraints.audio !== 'undefined' && !devices.audioInput.length) {
                this._deviceNotFoundError('audio');
            }
            this._domManager = new DomManager(this._config);
            this._initSignaling();
            if(this._config.currentUser !== null) {
                this.setCurrentUser(UserModel.fromJSON(this._config.currentUser));
            } else {
                this._currentUser = null;
            }
            this._initialized = true;
            this._isInitialized();
            this._eventSignalingBindings();
        }, (error) => {
            this._onAnyError(error.message, 'tbrtc-client > main > device list error');
        });
    }

    _isOnline() {
        return navigator.onLine;
    }

    _eventSignalingBindings() {
        this.on('Signaling', 'user.connected', this._baseHandlers.onConnected);
        this.on('Signaling', 'connection.closed', this._baseHandlers.onDisconnected);
        this.on('Signaling', 'connection.lost', this._baseHandlers.onDisconnected);
        this.on('Signaling', 'session.created', this._baseHandlers.onSessionCreated);
        this.on('Signaling', 'session.requested', this._baseHandlers.onSessionRequested);
        this.on('Signaling', 'session.confirmed', this._baseHandlers.onSessionNewUser);
        this.on('Signaling', 'session.joined', this._baseHandlers.onSessionJoined);
        this.on('Signaling', 'session.rejected', (event) => {
            if(event.data.user.id === this.currentUser.id) {
                this._baseHandlers.onSessionRejectedMe(event);
            } else {
                this._baseHandlers.onSessionRejected(event);
            }
        });
        this.on('Signaling', 'session.left', this._baseHandlers.onSessionLeft);
        this.on('Signaling', 'session.left.user', this._baseHandlers.onSessionUserLeft);
        this.on('Signaling', 'session.closed', this._baseHandlers.onSessionClosed);
        this.on('Signaling', 'session.request.stopped', this._baseHandlers.onRequestStopped);
        this.on('Signaling', 'chat.message', this._baseHandlers.onChatMessage);

        this.on('Signaling', 'result.success', this._baseHandlers.onSuccessMessage);
        this.on('Signaling', 'result.error', this._baseHandlers.onErrorMessage);
        this.on('Signaling', 'result.error', (event) => {
            this._onAnyError(new AnyError(event.data.message.content, 'tbrtc-client > Signaling > result.error'));
        });
        this.on('Signaling', 'signaling.error', (event) => {
            this._onAnyError(new AnyError(event.data.error.message, 'tbrtc-client > Connection > signaling error', { error: event.data.error }));
        });
    }

    setCurrentUser(currentUser) {
        ValueChecker.check({ currentUser }, {
            "currentUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": UserModel
            }
        });
        this._currentUser = currentUser;
    }

    start(mediaConstraints) {
        this._config = {...this.config, mediaConstraints};
        if(typeof this._instances.Signaling === 'undefined') {
            this._initSignaling();
            //this._eventSignalingBindings();
        }
        this._mediaRequest();
    }

    connectToServer() {
        if(this._instances.Signaling.state === this._instances.Signaling.states.DISCONNECTED) {
            this._instances.Signaling.initConnection(this._currentUser);
        }
    }

    isSuccessMessage(callback) {
        this._addEventHandler('onSuccessMessage', callback, event => event.data);
    }

    isErrorMessage(callback) {
        this._addEventHandler('onErrorMessage', callback, event => event.data);
    }

    isAnyError(callback) {
        this._onAnyError = TbRtcClient._checkCallback(callback);
    }

    isInitialized(callback) {
        this._isInitialized = TbRtcClient._checkCallback(callback);
    }

    isConnected(callback) {
        this._addEventHandler('onConnected', callback, event => event.data.user);
    }

    isSessionAvailable(callback) {
        this._addEventHandler('onSessionCreated', callback, event => event.data.sessionId);
    }

    isNewSession(callback) {
        this._addEventHandler('onSessionCreated', callback, event => event.data.sessionId);
    }

    isRequest(callback) {
        this._addEventHandler('onSessionRequested', callback, event => event.data.request);
    }

    isRequestStopped(callback) {
        this._addEventHandler('onRequestStopped', callback, event => event.data);
    }

    isJoined(callback) {
        this._addEventHandler('onSessionJoined', callback, event => event.data.session);
    }

    isRejected(callback) {
        this._addEventHandler('onSessionRejected', callback, event => event.data);
    }

    isRejectedMe(callback) {
        this._addEventHandler('onSessionRejectedMe', callback, event => event.data);
    }

    isNewUser(callback) {
        this._addEventHandler('onSessionNewUser', callback, event => event.data.user);
    }

    isNewChatMessage(callback) {
        this._addEventHandler('onChatMessage', callback, event => event.data.message);
    }

    isDisconnected(callback) {
        this._addEventHandler('onDisconnected', callback);
    }

    isSessionLeft(callback) {
        this._addEventHandler('onSessionLeft', callback);
    }

    isSessionUserLeft(callback) {
        this._addEventHandler('onSessionUserLeft', callback, event => event.data);
    }

    isSessionClosed(callback) {
        this._addEventHandler('onSessionClosed', callback);
    }

    isSessionUnavailable(callback) {
        this._addEventHandler('onSessionUnavailable', callback);
    }

    isFileTransferStart(callback) {
        this._addEventHandler('onFileTransferStart', callback, event => event.data);
    }

    isFileTransferProgress(callback) {
        this._addEventHandler('onFileTransferProgress', callback, event => event.data);
    }

    isFileSent(callback) {
        this._addEventHandler('onFileSent', callback, event => event.data);
    }

    isFileReceived(callback) {
        this._addEventHandler('onFileReceived', callback, event => event.data);
    }

    addFileInput(fileInput, inputId = null) {
        ValueChecker.check({ fileInput }, {
            "fileInput": {
                "required": true,
                "typeof": 'object',
                "instanceof": HTMLInputElement
            }
        });
        if(inputId === null && typeof fileInput.id !== 'undefined') {
            inputId = fileInput.id;
        } else if(inputId !== null && typeof fileInput.id === 'undefined') {
            fileInput.id = inputId;
        }
        const file = new FileInput(fileInput, this._config.filesConfig);
        this._observedFileInputs[inputId] = file;
        if(this._isRtcConnection()) {
            this._instances.Connection.addFileInput(file);
        }
        return file;
    }

    sendFiles(files = null, remoteUserId = null) {
        if(!this._isRtcConnection()) {
            throw new RtcConnectionNotInitialized('sendFiles');
        }
        return this._instances.Connection.sendFiles(files, remoteUserId);
    }

    _isRtcConnection() {
        return (
            typeof this._instances.Signaling === 'object'
            && typeof this._instances.Connection === 'object'
            && this._instances.Connection instanceof this.providers.Connection
            && this._sessionId !== null
        );
    }

    _addEventHandler(eventName, callback, transformParams = param => param) {
        const old = this._baseHandlers[eventName];
        this._baseHandlers[eventName] = (params) => {
            const newParams = transformParams(params);
            old.call(this, newParams);
            TbRtcClient._checkCallback(callback)(newParams);
        };
    }

    startSession() {
        if(!this._isRtcConnection()) {
            this._instances.Signaling.createNewSession();
        } else {
            this._onAnyError(new AnyError(new UserHasSession(this.sessionId), 'tbrtc-client > main > session error'));
        }
    }

    joinSession(sessionId) {
        this._instances.Signaling.joinSession(sessionId);
    }

    stopRequest(sessionId) {
        this._instances.Signaling.stopRequest(sessionId);
    }

    sendChatMessage(content) {
        this._instances.Signaling.sendChatMessage(content);
    }

    leaveSession() {
        this._instances.Signaling.leaveSession();
    }

    closeSession() {
        this._instances.Signaling.closeSession();
    }

    disconnect() {
        if(this._sessionId) {
            this.leaveSession();
            this._closeRtcConnection();
        }
        this._instances.Signaling.close();
        this._instances.Signaling = undefined;
    }

    _mediaRequest() {
        const context = this;
        if(context._mediaRequested) {
            this._onAnyError(new AnyError(new MediaRequestIsDone(), 'tbrtc-client > main > media error'));
        } else {
            const oldSuccessCallback = this.providers.MediaProvider.onSuccess;
            this.providers.MediaProvider.onSuccess = (stream) => {
                context._mediaRequested = true;
                this._localStream = stream;
                context._localVideo = new MediaElement(context._domManager.localVideo, stream, { autoInit: true });
                context._localVideo.onLoad = this._onLoadLocalVideo;
                context._localVideo.init();
                if(context._config.signaling.autoConnection) {
                    context.connectToServer();
                }
                oldSuccessCallback(stream);
            };
            const oldErrorCallback = this.providers.MediaProvider.onError;
            this.providers.MediaProvider.onError = (error) => {
                context._onAnyError(new AnyError(error.message, 'tbrtc-client > MediaProvider > onError'));
                oldErrorCallback(error);
            };
        }
        const anyMedia = Object.values(this._config.mediaConstraints).some(constraint => constraint !== false);
        if(this._initialized && anyMedia) {
            this.providers.MediaProvider.get(
                this.providers.ConstraintFilter.filterAll(
                    this._config.mediaConstraints
                )
            );
        } else if(this._config.signaling.autoConnection) {
            this.connectToServer();
        }
    }

    on(moduleName, eventName, handler) {
        ValueChecker.check({ handler }, {
            "handler": {
                "required": true,
                "typeof": 'function'
            }
        });
        switch (moduleName) {
            case 'MediaProvider':
                if (eventName === 'success') {
                    this.providers.MediaProvider.onSuccess = handler;
                } else if (eventName === 'error') {
                    this.providers.MediaProvider.onError = handler;
                }
                break;
            case 'VideoElement':
                if(eventName === 'onLocalLoad') {
                    this._onLoadLocalVideo = handler;
                } else if(eventName === 'onRemoteLoad') {
                    this._onLoadLocalVideo = handler;
                }
                break;
            default:
                if(typeof this._instances[moduleName] === 'undefined') {
                    throw new ModProviderNotFound(moduleName, eventName);
                }
                this._instances[moduleName].on(eventName, handler);
        }
    }

    set displayError(callback) {
        ValueChecker.check({ callback }, {
            "callback": {
                "required": true,
                "typeof": 'function'
            }
        });
        this._displayError = callback;
    }

    get config() {
        return this._config;
    }

    get currentUser() {
        return this._currentUser;
    }

    get localVideo() {
        return this._localVideo;
    }

    get remoteVideo() {
        return this._remoteVideo;
    }

    get localStream() {
        if(this.localVideo === null) {
            return null;
        }
        return this._localVideo.stream;
    }

    get sessionId() {
        return this._sessionId;
    }

    get observedFileInputs() {
        return this._observedFileInputs;
    }

    static _checkCallback(callback) {
        ValueChecker.check({ callback }, {
            "callback": {
                "required": true,
                "typeof": 'function'
            }
        });
        return callback;
    }
}

export default TbRtcClient;