import _ from 'underscore';
import ClassWithEvents from 'tbrtc-common/event/ClassWithEvents';
import EventContainer from 'tbrtc-common/event/EventContainer';
import Event from 'tbrtc-common/event/Event';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { IceCandidate } from 'tbrtc-common/model/IceCandidate';
import { Sdp } from 'tbrtc-common/model/Sdp';
import { User as UserModel } from 'tbrtc-common/model/User';
import DataTransfer from "../data/DataTransfer";
import RemoteUserIsLocal from '../../exceptions/RemoteUserIsLocal';
import PeerConnNotFound from '../../exceptions/PeerConnNotFound';
import RemoteUserExists from '../../exceptions/RemoteUserExists';
import PeerConnection from './PeerConnection';
import Stream from '../media/Stream';
import FileInput from "../dom/FileInput";
import {File as TransferFile} from "../data/File";

/**
 * This class provides functionality of a connection between multiple users. 
 * It uses peer connections for every two of them.
 */
class MultiConnection extends ClassWithEvents {
    /**
     * Initialization of the class and checking parameter types
     * 
     * @param {object} peerConfig 
     * @param {string} sessionId 
     * @param {UserModel} localUser 
     * @param {Stream|null} localStream
     */
    constructor(config, sessionId, localUser, localStream) {
        ValueChecker.check({ config, sessionId, localUser, localStream }, {
            "config": {
                "required": true,
                "typeof": 'object'
            },
            "sessionId": {
                "required": true,
                "typeof": 'string'
            },
            "localUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": UserModel
            },
            "localStream": {
                "typeof": ['object', null],
                "instanceof": Stream
            }
        });
        super();
        this._dataEvents = EventContainer.createInstance();
        DataTransfer.eventsOfDataTransfer.forEach(eventName => this._dataEvents.register(new Event(eventName)));

        this._config = config;
        this._sessionId = sessionId;
        this._localUser = localUser;
        this._localStream = localStream;
        this._connections = {};
        this._observedFileInputs = {};
        this._offerOptions = null;
    }

    /**
     * It adds new remote user
     *
     * @param {UserModel} remoteUser Model of remote user
     * @throws {RemoteUserExists} It's thrown when user with the same username is already added
     */
    addConnection(remoteUser) {
        ValueChecker.check({ remoteUser }, {
            "remoteUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": UserModel
            }
        });
        if (remoteUser.id === this.localUser.id) {
            throw new RemoteUserIsLocal(remoteUser.name);
        }
        if (this._connections[remoteUser.id] instanceof MultiConnection.SinglePeerAdapter) {
            throw new RemoteUserExists(this._localUser.name, remoteUser.name);
        }
        const connection = new MultiConnection.SinglePeerAdapter(
            this._config,
            this._localUser,
            remoteUser,
            this._localStream
        );
        connection.importEvents(this._events);
        connection.dataTransfer.importEvents(this._dataEvents);
        for(const fileInput of Object.values(this._observedFileInputs)) {
            connection.addFileInput(fileInput);
        }
        this._connections[remoteUser.id] = connection;

        if (this._offerOptions !== null) {
            this._connections[remoteUser.id].createOffer(this._offerOptions);
        }
    }

    /**
     * It finds a concrete peer connection for remote user with given identifier
     * 
     * @param {string} remoteUserId Identifier of a remote user
     * @returns {PeerConnection}
     */
    getConnection(remoteUserId) {
        const connection = this._connections[remoteUserId];
        if (connection === undefined) {
            throw new PeerConnNotFound(this.localUser.name, userId);
        }
        return connection;
    }

    /**
     * It removes the connection with specified remote user. If it's already active, it will be closed.
     *
     * @param {UserModel} remoteUser Model of remote user
     */
    removeConnection(remoteUser) {
        ValueChecker.check({ remoteUser }, {
            "remoteUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": UserModel
            }
        });
        if(typeof this._connections[remoteUser.id] === 'undefined') {
            throw new PeerConnNotFound(this.localUser.name, remoteUser.name);
        }
        this._connections[remoteUser.id].close();
        delete this._connections[remoteUser.id];
    }

    /**
     * It closes all peer connections
     */
    close() {
        this.connectionsArray.forEach(connection => connection.close());
    }

    /**
     * It creates an offer to start connection with all remote users
     *
     * @param {object} offerOptions Options of offer
     */
    createOffer(offerOptions = {}) {
        this.connectionsArray.forEach(connection => connection.createOffer(offerOptions));
        this._offerOptions = offerOptions;
    }

    /**
     * It adds new local stream
     * 
     * @param {Stream} localStream Object of local stream
     */
    addLocalStream(localStream) {
        this.connectionsArray.forEach(connection => connection.addLocalStream(localStream));
    }

    /**
     * It sets session description from remote user
     * 
     * @param {Sdp} sdp SDP data from remote user
     * @param {string} remoteUserId Identifier of remote user
     */
    setRemoteDescription(sdp, remoteUserId) {
        const connection = this.getConnection(remoteUserId);
        connection.setRemoteDescription(sdp);
    }

    /**
     * It adds ICE candidate data from remote user
     * 
     * @param {IceCandidate} ice Object with ICE candidate data from remote user
     * @param {string} remoteUserId Identifier of remote user
     */
    addIceCandidate(ice, remoteUserId) {
        const connection = this.getConnection(remoteUserId);
        connection.addIceCandidate(ice);
    }

    /**
     * It adds new file input field to be observed. After that, according to configuration, file can be sent immediately after being chosen.
     *
     * @param {FileInput} fileInput Object of wrapped HTML file input field
     */
    addFileInput(fileInput) {
        ValueChecker.check({ fileInput }, {
            "fileInput": {
                "required": true,
                "typeof": 'object',
                "instanceof": FileInput
            }
        });
        this._observedFileInputs[fileInput.id] = fileInput;
        this.connectionsArray.forEach(connection => connection.addFileInput(fileInput));
    }

    /**
     * It sends the given files to remote user.
     * If any file is not given, it will send files from observed inputs.
     * If any remote user is not given, it will be sent to all remote user.
     *
     * @param {TransferFile[]|null} files Files to be sent
     * @param {string|null} remoteUserId Id of remote user to whom should be sent files
     */
    sendFiles(files = null, remoteUserId = null) {
        if(remoteUserId !== null) {
            const connection = this.getConnection(remoteUserId);
            connection.sendFiles(files);
        } else {
            this.connectionsArray.forEach(connection => connection.sendFiles(files));
        }
    }

    /**
     * Adding event handlers to this multi connection. Events are the same like in {@link PeerConnection} class.
     *
     * @param {string} eventName Name of event for which is adding the handler
     * @param {function} handler Handler for event
     */
    on(eventName, handler) {
        const connections = this.connectionsArray;
        if(this.builtInEvents.indexOf(eventName) >= 0) {
            super.on(eventName, handler);
            connections.forEach(connection => {
                connection.on(eventName, handler);
            });
        } else {
            this._dataEvents.on(eventName, handler);
            connections.forEach(connection => {
                connection.dataTransfer.on(eventName, handler);
            });
        }
    }

    /**
     * List of all peer connections. it's an object where keys are user ids and values are peer connections.
     *
     * @property
     * @readonly 
     * @type {object}
     */
    get connections() {
        return this._connections;
    }

    /**
     * Model of local user
     * 
     * @readonly 
     * @type {UserModel}
     */
    get localUser() {
        return this._localUser;
    }

    /**
     * Local stream object
     *
     * @property
     * @readonly 
     * @type {Stream}
     */
    get localStream() {
        return this._localStream;
    }

    /**
     * Session identifier
     *
     * @property
     * @readonly 
     * @type {string}
     */
    get sessionId() {
        return this._sessionId;
    }

    /**
     * Array of peer connections
     *
     * @property
     * @readonly
     * @type {PeerConnection[]}
     */
    get connectionsArray() {
        return _.values(this._connections);
    }

    /**
     * Array of available events for this class
     *
     * @property
     * @readonly
     * @type {string[]}
     */
    get builtInEvents() {
        return MultiConnection.SinglePeerAdapter.eventsOfConnection;
    }
}

/**
 * As default peer connection adapter is chosen {@link PeerConnection} class
 */
MultiConnection.SinglePeerAdapter = PeerConnection;

export default MultiConnection;