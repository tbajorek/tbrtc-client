import 'webrtc-adapter/out/adapter';
import merge from 'deepmerge';
import Translation from 'tbrtc-common/translate/Translation';
import {Communication} from 'tbrtc-common/messages/Communication';
import {User as UserModel} from 'tbrtc-common/model/User';
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
import Stream from '../media/Stream';
import AnyError from './AnyError';
import RtcConnectionNotInitialized from '../../exceptions/RtcConnectionNotInitialized';
import UserIsOffline from '../../exceptions/UserIsOffline';
import UserHasSession from '../../exceptions/UserHasSession';
import MediaRequestIsDone from '../../exceptions/MediaRequestIsDone';
import FileInput from '../dom/FileInput';
import PeerConnectionNotInitialized from '../../exceptions/PeerConnectionNotInitialized';
import moment from 'moment';

class TbRtcClient {
    constructor(userConfig = {}) {
        this.providers = {
            MediaProvider: UserMedia,
            Signaling: Socket,
            MediaElement,
            Connection: MultiConnection,
            ConstraintFilter: Constraints,
            Information,
            DevicesList: Devices,
        };
        this._instances = {};
        this._config = merge(defaultConfig, userConfig);
        if(typeof this._config.locale === 'string') {
            Translation.instance.setLocale(this._config.locale);
        }
        moment.locale(Translation.instance.getLocale().replace('_', '-'));
        this._localVideo = null;
        this._remoteVideo = null;
        this._localStream = null;
        this._remoteStream = null;
        this._sessionId = null;
        this._baseHandlers = {
            onInitialized: () => {
                if (this._shouldStart) {
                    this.start();
                }
            },
            onLoadLocalVideo: () => {
            },
            onLoadRemoteVideo: () => {
            },
            onConnected: (user) => {
            },
            onDisconnected: () => {
                this._baseHandlers.onSessionUnavailable();
                this._closeRtcConnection();
            },
            onSessionAvailable: (e) => {
            },
            onSessionCreated: (e) => {
                const {sessionId} = e.data;
                this._sessionId = sessionId;
                this._initRtcConnection(sessionId);
                this._baseHandlers.onSessionAvailable(sessionId);
            },
            onSessionRequested: (e) => {
            },
            onSessionJoined: (e) => {
                const {session} = e.data;
                this._sessionId = session.id;
                this._sessionMembers = session.members;
                this._initRtcConnection(session.id);
                this._baseHandlers.onSessionAvailable(session.id);
            },
            onSessionNewUser: (e) => {
                if(!!this._instances.Connection) {
                    const {user} = e.data;
                    this._instances.Connection.addConnection(user);
                    this._instances.Connection.addLocalStream(this._localStream);
                }
            },
            onSessionRejected: (e) => {
            },
            onSessionRejectedMe: (e) => {
            },
            onRequestStopped: (e) => {
            },
            onChatMessage: () => {
            },
            onSessionLeft: () => {
                this._closeRtcConnection();
                this._baseHandlers.onSessionUnavailable();
            },
            onSessionUserLeft: (e) => {
                this._instances.Connection.removeConnection(e.data.user);
            },
            onSessionClosed: () => {
                this._closeRtcConnection();
                this._baseHandlers.onSessionUnavailable();
            },
            onSessionUnavailable: () => {
            },
            onUserCommunication: () => {
            },
            onSuccessMessage: (e) => {
            },
            onErrorMessage: (e) => {
            },
            onFileTransferStart: (e) => {
            },
            onFileTransferProgress: (e) => {
            },
            onFileSent: (e) => {
            },
            onFileReceived: (e) => {
            },
            onReady: () => {
            },
            onP2pStateChange: (e) => {}
        };
        this._onLoadLocalVideo = () => {
        };
        this._onLoadRemoteVideo = () => {
        };
        this._onAnyError = (error) => {
        };
        this._displayError = this._config.displayError;
        this._mediaRequested = false;
        this._initialized = false;
        this._shouldStart = false;
        this._anyMedia = false;
        this._localVideoBound = false;
        this._remoteVideoBound = false;
        this._observedFileInputs = {};
        this._init();
    }

    get hasSignalingConnection() {
        return !!this._instances.Signaling && this._instances.Signaling.hasSignalingConnection;
    }

    _deviceNotFoundError(dtype) {
        const message = Translation.instance._('Any device type {dtype} has not found', {
            dtype,
        });
        this._displayError(message);
    }

    _initRtcConnection(sessionId) {
        this._sessionId = sessionId;
        this._instances.Connection = new this.providers.Connection(this._config, this._sessionId, this._currentUser, this._localStream);
        console.log(this._localStream);
        for (const fileInput of Object.values(this._observedFileInputs)) {
            this._instances.Connection.addFileInput(fileInput);
        }

        this.on('Connection', 'error', (event) => {
            this._onAnyError(new AnyError(event.data.error.message, 'tbrtc-client > Connection > error'));
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
            this._remoteStream = event.data.stream;
            if (this._config.autoBindingMedia || this._remoteVideoBound) {
                this.bindWithRemoteVideo();
            }
        });
        this.on('Signaling', 'ice.received', (event) => {
            this._instances.Connection.addIceCandidate(event.data.ice, event.data.ice.sender.id);
        });
        this.on('Signaling', 'sdp.received', (event) => {
            this._instances.Connection.setRemoteDescription(event.data.sdp, event.data.sdp.sender.id);
        });
        this.on('Connection', 'istate.changed', (event) => {
            this._baseHandlers.onP2pStateChange({ ...event.data });
        });
        // data transfer
        this.on('Connection', 'data.error.occured', (error) => {
            this._onAnyError(new AnyError(error.message, 'tbrtc-client > Connection > data error'));
        });
        this.on('Connection', 'send.file.started', (event) => {
            this._baseHandlers.onFileTransferStart({...event.data, type: 'sent'});
        });
        this.on('Connection', 'receive.file.started', (event) => {
            this._baseHandlers.onFileTransferStart({...event.data, type: 'received'});
        });
        this.on('Connection', 'send.file.updated', (event) => {
            this._baseHandlers.onFileTransferProgress({...event.data, type: 'sent'});
        });
        this.on('Connection', 'receive.file.updated', (event) => {
            this._baseHandlers.onFileTransferProgress({...event.data, type: 'received'});
        });
        this.on('Connection', 'send.file.finished', (event) => {
            this._baseHandlers.onFileSent(event.data);
        });
        this.on('Connection', 'receive.file.finished', (event) => {
            this._baseHandlers.onFileReceived(event.data);
        });

        if (Array.isArray(this._sessionMembers)) {
            this._sessionMembers.forEach((member) => {
                if (member.id !== this._currentUser.id) {
                    this._instances.Connection.addConnection(member);
                }
            });
            this._sessionMembers = null;
            this._startRtcProcess();
        }

        if (!this._mediaRequested) {
            this._mediaRequest();
        }
    }

    _startRtcProcess() {
        if (this._isRtcConnection()) {
            this._instances.Connection.createOffer(this._config.offerOptions);
        } else {
            this._onAnyError(new AnyError((new PeerConnectionNotInitialized()).message, 'tbrtc-client > main > error'));
        }
    }

    _closeRtcConnection() {
        if (typeof this._instances.Connection !== 'undefined' && this._isRtcConnection()) {
            this._instances.Connection.close();
            this._instances.Connection = undefined;
            this._sessionId = null;
        }
    }

    _initSignaling() {
        this._instances.Signaling = new this.providers.Signaling(this._config.signaling);
    }

    _init() {
        if (!this._isOnline()) {
            this._onAnyError(new AnyError((new UserIsOffline()).message, 'tbrtc-client > main > error'));
        }
        this.providers.MediaProvider.debug = this._config.debug;
        this.providers.DevicesList.showWarnings = this._config.debug;
        this.providers.DevicesList.load((devices) => {
            if (typeof this._config.mediaConstraints.video !== 'undefined' && !devices.videoInput.length) {
                this._deviceNotFoundError('video');
            }
            if (typeof this._config.mediaConstraints.audio !== 'undefined' && !devices.audioInput.length) {
                this._deviceNotFoundError('audio');
            }
            this._domManager = new DomManager(this._config);
            this._initSignaling();
            if (this._config.currentUser !== null) {
                this.setCurrentUser(UserModel.fromJSON(this._config.currentUser));
            } else if (!(this._currentUser instanceof UserModel)) {
                this._currentUser = null;
            }
            this._initialized = true;
            this._baseHandlers.onInitialized();
            this._eventSignalingBindings();
        }, (error) => {
            if(this._config.debug) {
                console.error(error);
            }
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
            if (event.data.user.id === this.currentUser.id) {
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
        this.on('Signaling', 'user.communication', this._baseHandlers.onUserCommunication);

        this.on('Signaling', 'result.success', this._baseHandlers.onSuccessMessage);
        this.on('Signaling', 'result.error', this._baseHandlers.onErrorMessage);
        this.on('Signaling', 'result.error', (event) => {
            this._onAnyError(new AnyError(event.data.message.content, 'tbrtc-client > Signaling > result.error'));
        });
        this.on('Signaling', 'signaling.error', (event) => {
            this._onAnyError(new AnyError(event.data.error.message, 'tbrtc-client > Connection > signaling error', {error: event.data.error}));
        });
        this._baseHandlers.onReady();
    }

    setCurrentUser(currentUser) {
        ValueChecker.check({currentUser}, {
            currentUser: {
                required: true,
                typeof: 'object',
                instanceof: UserModel,
            },
        });
        this._currentUser = currentUser;
    }

    start(mediaConstraints = null) {
        if (mediaConstraints) {
            this._config = {...this.config, mediaConstraints};
        }
        this._anyMedia = Object.values(this._config.mediaConstraints).some(constraint => constraint !== false);
        if (this._initialized) {
            if (typeof this._instances.Signaling === 'undefined') {
                this._initSignaling();
            }
            if (this._config.signaling.autoConnection) {
                this.connectToServer();
            }
            this._shouldStart = false;
        } else {
            console.warn('Not yet initialized before starting');
            this._shouldStart = true;
            this._init();

        }
    }

    sendDataToUser(data, userId) {
        if(typeof this._instances.Signaling !== 'undefined') {
            this._instances.Signaling.sendMessage(new Communication(new UserModel(userId, null, null, null), this.currentUser, data));
        } else {
            this._onAnyError(new AnyError(new Error(Translation.instance._('Signaling service is not initialized')), 'tbrtc-client > main > signaling error'));
        }
    }

    connectToServer() {
        if(typeof this._instances.Signaling !== 'undefined') {
            this._onAnyError(new AnyError(new Error(Translation.instance._('Signaling service is not initialized')), 'tbrtc-client > main > signaling error'));
            return;
        }
        if (this._instances.Signaling.state === this._instances.Signaling.states.DISCONNECTED) {
            this._instances.Signaling.initConnection(this._currentUser);
        } else {
            const message = Translation.instance._('Signaling connection can not be initialized in its current state: {cstate}', {
                cstate: this._instances.Signaling.state,
            });
            this._onAnyError(new AnyError(new Error(message), 'tbrtc-client > main > connection error'));
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
        this._addEventHandler('onInitialized', callback);
    }

    isReady(callback) {
        this._addEventHandler('onReady', callback);
    }

    isConnected(callback) {
        this._addEventHandler('onConnected', callback, event => event.data.user);
    }

    isUserCommunication(callback) {
        this._addEventHandler('onUserCommunication', callback, event => event.data);
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

    isP2pStateChange(callback) {
        this._addEventHandler('onP2pStateChange', callback);
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
        this._addEventHandler('onFileTransferStart', callback);
    }

    isFileTransferProgress(callback) {
        this._addEventHandler('onFileTransferProgress', callback);
    }

    isFileSent(callback) {
        this._addEventHandler('onFileSent', callback);
    }

    isFileReceived(callback) {
        this._addEventHandler('onFileReceived', callback);
    }

    addFileInput(fileInput, inputId = null) {
        ValueChecker.check({fileInput}, {
            fileInput: {
                required: true,
                typeof: 'object',
                instanceof: HTMLInputElement,
            },
        });
        if (inputId === null && typeof fileInput.id !== 'undefined') {
            inputId = fileInput.id;
        } else if (inputId !== null && typeof fileInput.id === 'undefined') {
            fileInput.id = inputId;
        }
        const file = new FileInput(fileInput, this._config.filesConfig);
        this._observedFileInputs[inputId] = file;
        if (this._isRtcConnection()) {
            this._instances.Connection.addFileInput(file);
        }
        return file;
    }

    getObservedFileInput(inputId) {
        const file = this._observedFileInputs[inputId];
        return !!file ? file: null;
    }

    sendFiles(files = null, remoteUserId = null) {
        if (!this._isRtcConnection()) {
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
            old.call(this, params);
            TbRtcClient._checkCallback(callback)(newParams);
        };
    }

    startSession() {
        if (!this._isRtcConnection()) {
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
        console.log('closing', this._instances.Signaling.hasSignalingConnection, this._instances.Signaling.isConnectionState(WebSocket.OPEN));
        if(this._instances.Signaling.hasSignalingConnection && this._instances.Signaling.isConnectionState(WebSocket.OPEN)) {
            this._instances.Signaling.closeSession();
        } else {
            console.log(Translation.instance._('You can not close the session because you are disconnected'));
        }
    }

    disconnect() {
        if (this._sessionId) {
            this.leaveSession();
            this._closeRtcConnection();
        }
        if (this._instances.Signaling) {
            this._instances.Signaling.close();
            this._instances.Signaling = undefined;
        }
        this._initialized = false;
        this._anyMedia = false;
    }

    bindWithLocalVideo() {
        if (this._localStream !== null) {
            this._localVideo = new MediaElement(this._domManager.localVideo, this._localStream, {autoInit: true});
            this._localVideo.onLoad = this._onLoadLocalVideo;
        }
        this._localVideoBound = true;
    }

    bindWithRemoteVideo() {console.log('remote.bound', this._remoteStream);
        if (this._remoteStream !== null) {
            this._remoteVideo = new MediaElement(this._domManager.remoteVideo, this._remoteStream, {autoInit: true});
            this._remoteVideo.onLoad = this._onLoadRemoteVideo;
        }
        this._remoteVideoBound = true;
    }

    _mediaRequest() {
        const context = this;
        if (context._mediaRequested) {
            this._onAnyError(new AnyError(new MediaRequestIsDone(), 'tbrtc-client > main > media error'));
        } else {
            const oldSuccessCallback = this.providers.MediaProvider.onSuccess;
            this.providers.MediaProvider.onSuccess = (stream) => {
                context._mediaRequested = true;
                context._localStream = stream;console.log('media request1', context._localStream, context._instances.Connection);
                if(!!context._instances.Connection) {
                    context._instances.Connection.addLocalStream(stream);
                }console.log('media request2', context._localStream);
                if (context._config.autoBindingMedia || context._localVideoBound) {
                    context.bindWithLocalVideo.bind(context)();
                }console.log('media request3', context._localStream);
                oldSuccessCallback(stream);
            };
            const oldErrorCallback = context.providers.MediaProvider.onError;
            this.providers.MediaProvider.onError = (error) => {console.error(this.providers.MediaProvider.debug, error);
                context._onAnyError(new AnyError(error.message, 'tbrtc-client > MediaProvider > onError'));
                oldErrorCallback(error);
            };
        }

        if (this._initialized && this._anyMedia) {
            this.providers.MediaProvider.get(
                this.providers.ConstraintFilter.filterAll(
                    this._config.mediaConstraints,
                ),
            );
        }
    }

    on(moduleName, eventName, handler) {
        ValueChecker.check({handler}, {
            handler: {
                required: true,
                typeof: 'function',
            },
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
                if (eventName === 'onLocalLoad') {
                    this._onLoadLocalVideo = handler;
                } else if (eventName === 'onRemoteLoad') {
                    this._onLoadLocalVideo = handler;
                }
                break;
            default:
                if (typeof this._instances[moduleName] === 'undefined') {
                    throw new ModProviderNotFound(moduleName, eventName);
                }
                this._instances[moduleName].on(eventName, handler);
        }
    }

    set displayError(callback) {
        ValueChecker.check({callback}, {
            callback: {
                required: true,
                typeof: 'function',
            },
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
        if (this.localVideo === null) {
            return null;
        }
        return this._localVideo.stream;
    }

    get remoteStream() {
        if (this.localVideo === null) {
            return null;
        }
        return this._remoteVideo.stream;
    }

    get sessionId() {
        return this._sessionId;
    }

    get domManager() {
        return this._domManager;
    }

    get observedFileInputs() {
        return this._observedFileInputs;
    }

    static _checkCallback(callback) {
        ValueChecker.check({callback}, {
            callback: {
                required: true,
                typeof: 'function',
            },
        });
        return callback;
    }
}

export default TbRtcClient;
