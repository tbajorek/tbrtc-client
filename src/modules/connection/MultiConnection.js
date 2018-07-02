import _ from 'underscore';
import ClassWithEvents from 'tbrtc-common/event/ClassWithEvents';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { IceCandidate } from 'tbrtc-common/model/IceCandidate';
import { Sdp } from 'tbrtc-common/model/Sdp';
import { User as UserModel } from 'tbrtc-common/model/User';
import PeerConnNotFound from '../../exceptions/PeerConnNotFound';
import RemoteUserExists from '../../exceptions/RemoteUserExists';
import PeerConnection from './PeerConnection';
import Stream from '../media/Stream';

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
     * @param {Stream} localStream 
     */
    constructor(peerConfig, sessionId, localUser, localStream) {
        super();
        ValueChecker.check({ peerConfig, sessionId, localUser, localStream }, {
            "peerConfig": {
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
                "instanceof": User
            },
            "localStream": {
                "required": true,
                "typeof": 'object',
                "instanceof": Stream
            }
        });
        this._peerConfig = peerConfig;
        this._sessionId = sessionId;
        this._localUser = localUser;
        this._localStream = localStream;
        this._connections = {};
        this._offerOptions = null;
    }

    /**
     * It finds a concrete peer connection for remote user with given identifier
     * 
     * @param {string} remoteUserId Identifier of a remote user
     * @returns {PeerConnection}
     */
    getConnection(remoteUserId) {
        const connection = this._connections[remoteUserId];
        if (connection === null) {
            throw new PeerConnNotFound(this.localUser.name, userId);
        }
        return connection;
    }

    /**
     * Adding event handlers to this multi connection. Events are the same like in {@link PeerConnection} class.
     * 
     * @param {string} eventName Name of event for which is adding the handler
     * @param {function} handler Handler for event
     */
    on(eventName, handler) {
        super.on(eventName, handler);

        const connections = this.connectionsArray;
        connections.forEach(connection => {
            connection._events = this.events;
        });
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
     * It closes all peer connections
     */
    close() {
        this.connectionsArray.forEach(connection => connection.close());
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
        if (this._connections[remoteUser.id] !== null) {
            throw new RemoteUserExists(this._localUser.name, remoteUser.name);
        }
        this._connections[remoteUser.id] = new MultiConnection.SinglePeerAdapter(
            this._peerConfig,
            this._localUser,
            remoteUser,
            this._localStream
        );
        this._connections[remoteUser.id]._events = this.events;
        if (this._offerOptions !== null) {
            this._connections[remoteUser.id].createOffer(this._offerOptions);
        }
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
     * List of all peer connections. it's an object where keys are user ids and values are peer connections.
     * 
     * @readonly 
     * @returns {object}
     */
    get connections() {
        return this._connections;
    }

    /**
     * Model of local user
     * 
     * @readonly 
     * @returns {UserModel}
     */
    get localUser() {
        return this._localUser;
    }

    /**
     * Local stream object
     * 
     * @readonly 
     * @returns {Stream}
     */
    get localStream() {
        return this._localStream;
    }

    /**
     * Session identifier
     * 
     * @readonly 
     * @returns {string}
     */
    get sessionId() {
        return this._sessionId;
    }

    /**
     * Array of peer connections
     * @returns {PeerConnection[]}
     */
    get connectionsArray() {
        return _.values(this._connections);
    }
}

/**
 * As default peer connection adapter is chosen {@link PeerConnection} class
 */
MultiConnection.SinglePeerAdapter = PeerConnection;

export default MultiConnection;