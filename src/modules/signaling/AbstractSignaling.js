import Event from 'tbrtc-common/event/Event';
import EventContainer from 'tbrtc-common/event/EventContainer';
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import { User as UserModel } from 'tbrtc-common/model/User';
import { Message } from 'tbrtc-common/messages/Message';
import { User as UserMessage } from 'tbrtc-common/messages/User';
import { Session as SessionMessage } from 'tbrtc-common/messages/Session';
import MessageFactory from 'tbrtc-common/factory/MessageFactory';
import AbstractClassUsed from '../../exceptions/AbstractClassUsed';
import PeerConnection from '../connection/PeerConnection';
import SessionRequest from "./SessionRequest";

class AbstractSignaling {
    constructor(config) {
        this._config = config;
        this._events = EventContainer.instance;
        this.builtInEvents.forEach(eventName => this._events.register(new Event(eventName)));
        this._initialize();
        this._peerConnections = [];
        this._currentUser = null;
        this._currentSessionId = null;
    }

    sendMessage(message) {
        if(message instanceof Message) {
            this._send(message.toString());
        } else {
            throw new BadParamType('message', 'sendMessage', 'tbrtc-common/messages/Message');
        }
    }

    _initialize() {
        throw new AbstractClassUsed('modules/signaling/AbstractSignaling');
    }

    _send(message) {
        throw new AbstractClassUsed('modules/signaling/AbstractSignaling');
    }

    _connect() {
        throw new AbstractClassUsed('modules/signaling/AbstractSignaling');
    }

    initConnection(user) {
        this._currentUser = user;
        this._connect();
    }

    createNewSession() {
        this.sendMessage(
            new SessionMessage('session.new', null, this._currentUser)
        );
    }

    addPeerConnection(peerConnection) {
        if(peerConnection instanceof PeerConnection) {
            this._peerConnections.push(peerConnection);
        } else {
            throw new BadParamType('peerConnection', 'addPeerConnection', 'modules/connection/PeerConnection');
        }
    }

    joinSession(sessionId) {
        this.sendMessage(
            new SessionMessage('session.request', sessionId, this._currentUser)
        );
    }

    sessionLeave() {

    }

    sendIce(ice) {

    }

    sendSdp(sdp) {
        if(sdp.type === Sdp.types.OFFER) {
            this.dispatch('offer.sent', sdp);
        } else {
            this.dispatch('answer.sent', sdp);
        }
        this.dispatch()
    }

    /**
     * Produce Message object from JSON data. Event 'message.received' is dispatched.
     * @param {Object} jsonMessage JSON object with message data
     * @protected
     */
    _receiveMessage(jsonMessage) {
        const message = MessageFactory.createFromJson(jsonMessage);
        console.log(message.type);
        this.dispatch('message.received', { message });
        switch (message.type) {
            case 'user.init':
                this._userInit(message.user);
                break;
            case 'session.new':
                this._sessionNew(message.sessionId);
                break;
            case 'session.request':
                this._sessionRequest(message);
                break;
            case 'session.confirm':
                this._sessionConfirm(message);
                break;
            case 'session.reject':
                this._sessionReject(message);
                break;
            case 'success':
                this.dispatch('result.success', { message });
                break;
            case 'error':
                this.dispatch('result.error', { message });
                break;
        }
    }

    _userInit(sourceUser) {
        this._currentUser.connectionId = sourceUser.connectionId;
        this._currentUser.id = sourceUser.id;
        console.log(this._currentUser);
        this.sendMessage(
            new UserMessage('user.connect', this._currentUser)
        );
    }

    _sessionNew(sessionId) {
        this._currentSessionId = sessionId;
        this.dispatch('session.created', { sessionId });
    }

    _sessionRequest(message) {
        this.dispatch('session.requested', {
            request: new SessionRequest(message, this._sessionAnswer.bind(this))
        });
    }

    _sessionAnswer(message) {
        this.sendMessage(message);
    }

    _sessionConfirm(message) {
        const { sessionId, user } = message;
        this.dispatch('session.confirmed', { sessionId, user });
    }

    _sessionReject(message) {
        const { sessionId, user } = message;
        this.dispatch('session.rejected', { sessionId, user });
    }

    _connectionLost() {
        this.dispatch('connection.lost');
    }

    _connectionClosed() {
        this.dispatch('connection.closed');
    }

    /**
     * Add new handler to specified event
     * @param {string} eventName Name of event
     * @param {function} handler Handler to be executed when event occurs
     */
    on(eventName, handler) {
        this.events.on(eventName, handler);
    }

    dispatch(eventName, params) {
        return this.events.dispatch(eventName, { ...params, client: this });
    }

    get config() {
        return this._config;
    }

    get events() {
        return this._events;
    }

    get currentUser() {
        return this._currentUser;
    }

    get currentSessionId() {
        return this._currentSessionId;
    }

    /**
     * Return built-in events
     * @returns {string[]} Built-in events
     */
    get builtInEvents() {
        return [
            'connection.opened',
            'connection.lost',
            'connection.closed',
            'session.created',
            'session.requested',
            'session.confirmed',
            'session.rejected',
            'offer.sent',
            'offer.received',
            'answer.sent',
            'answer.received',
            'message.received',
            'result.success',
            'result.error',
        ]
    }
}

export default AbstractSignaling;
