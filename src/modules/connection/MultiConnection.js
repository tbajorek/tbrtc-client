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
     * @param {UserModel} currentUser 
     * @param {Stream} currentStream 
     */
    constructor(peerConfig, sessionId, currentUser, currentStream) {
        super();
        ValueChecker.check({ peerConfig, sessionId, currentUser, currentStream }, {
            "peerConfig": {
                "required": true,
                "typeof": 'object'
            },
            "sessionId": {
                "required": true,
                "typeof": 'string'
            },
            "currentUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": User
            },
            "currentStream": {
                "required": true,
                "typeof": 'object',
                "instanceof": Stream
            }
        });
        this._peerConfig = peerConfig;
        this._sessionId = sessionId;
        this._currentUser = currentUser;
        this._currentStream = currentStream;
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
            throw new PeerConnNotFound(this.currentUser.name, userId);
        }
        return connection;
    }

    /**
     * 
     * @param {string} eventName 
     * @param {function} handler 
     */
    on(eventName, handler) {
        super.on(eventName, handler);

        const connections = this.connectionsArray;
        connections.forEach(connection => {
            connection._events = this.events;
        });
    }

    createOffer(offerOptions = {}) {
        this.connectionsArray.forEach(connection => connection.createOffer(offerOptions));
        this._offerOptions = offerOptions;
    }

    close() {
        this.connectionsArray.forEach(connection => connection.close());
    }

    /**
     * 
     * @param {UserModel} remoteUser 
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
            throw new RemoteUserExists(this._currentUser.name, remoteUser.name);
        }
        this._connections[remoteUser.id] = new MultiConnection.SinglePeerAdapter(
            this._peerConfig,
            this._currentUser,
            remoteUser,
            this._currentStream
        );
        this._connections[remoteUser.id]._events = this.events;
        if (this._offerOptions !== null) {
            this._connections[remoteUser.id].createOffer(this._offerOptions);
        }
    }

    /**
     * 
     * @param {Stream} localStream 
     */
    addLocalStream(localStream) {
        this.connectionsArray.forEach(connection => connection.addLocalStream(localStream));
    }

    /**
     * 
     * @param {Sdp} sdp 
     * @param {string} remoteUserId 
     */
    setRemoteDescription(sdp, remoteUserId) {
        const connection = this.getConnection(remoteUserId);
        connection.setRemoteDescription(sdp);
    }

    /**
     * 
     * @param {IceCandidate} ice 
     * @param {string} remoteUserId 
     */
    addIceCandidate(ice, remoteUserId) {
        const connection = this.getConnection(remoteUserId);
        connection.addIceCandidate(ice);
    }

    /**
     * @returns {object}
     */
    get connections() {
        return this._connections;
    }

    /**
     * @returns {UserModel}
     */
    get currentUser() {
        return this._currentUser;
    }

    /**
     * @returns {Stream}
     */
    get currentStream() {
        return this._currentStream;
    }

    /**
     * @returns {string}
     */
    get sessionId() {
        return this._sessionId;
    }

    /**
     * @returns {PeerConnection[]}
     */
    get connectionsArray() {
        return _.values(this._connections);
    }
}

MultiConnection.SinglePeerAdapter = PeerConnection;

export default MultiConnection;