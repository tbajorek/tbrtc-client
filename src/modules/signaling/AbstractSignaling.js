import dateformat from 'dateformat';
import Translation from 'tbrtc-common/translate/Translation';
import Event from 'tbrtc-common/event/Event';
import EventContainer from 'tbrtc-common/event/EventContainer';
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import { Message } from 'tbrtc-common/messages/Message';
import { User as UserMessage } from 'tbrtc-common/messages/User';
import { Session as SessionMessage } from 'tbrtc-common/messages/Session';
import { IceCandidate as IceMessage } from 'tbrtc-common/messages/IceCandidate';
import { SdpTransfer as SdpMessage } from 'tbrtc-common/messages/SdpTransfer';
import { Chat as ChatMessage } from 'tbrtc-common/messages/Chat';
import { Sdp } from 'tbrtc-common/model/Sdp';
import MessageFactory from 'tbrtc-common/factory/MessageFactory';
import AbstractClassUsed from '../../exceptions/AbstractClassUsed';
import SessionRequest from "./SessionRequest";

/**
 * Abstract signaling mechanism. It must be extended by concrete implementation.
 */
class AbstractSignaling {
    constructor(config) {
        this._config = config;
        this._events = EventContainer.createInstance();
        this.builtInEvents.forEach(eventName => this._events.register(new Event(eventName)));
        this._initialize();
        this._currentUser = null;
        this._currentSessionId = null;
        this._state = this.states.DISCONNECTED;
        if(typeof window !== 'undefined') {
            window.onbeforeunload = () => {
                this.close();
            };
            window.onkeyup = (e) => {
                if (e.keyCode === 116)
                    this.close();
            };
        }
    }

    sendMessage(message) {
        if(message instanceof Message) {
            if(this.hasSignalingConnection) {
                this._send(message.toString());
            } else {
                console.warn(Translation.instance._('Signaling message can not be sent because connection is not established'));
            }
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

    get connectionState() {
        throw new AbstractClassUsed('modules/signaling/AbstractSignaling');
    }

    isConnectionState(requested) {
        return this.connectionState && this.connectionState === requested;
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

    joinSession(sessionId) {
        this.sendMessage(
            new SessionMessage('session.request', sessionId, this._currentUser)
        );
    }

    stopRequest(sessionId) {
        this.sendMessage(
            new SessionMessage('session.stop', sessionId, this._currentUser)
        );
    }

    sendChatMessage(content) {
        if(this.currentSessionId === null) {
            this.dispatch('result.error', { message: Translation.instance._('The message can not be sent because you are not a member of a session') });
        }
        this.sendMessage(
            new ChatMessage(this.currentSessionId, this._currentUser, content, dateformat(new Date(), "fullDate"))
        );
    }

    leaveSession() {
        this.sendMessage(
            new SessionMessage('session.leave', this._currentSessionId, this._currentUser)
        );
    }

    closeSession() {
        this.sendMessage(
            new SessionMessage('session.close', this._currentSessionId, this._currentUser)
        );
    }

    close() {
        throw new AbstractClassUsed('modules/signaling/AbstractSignaling');
    }

    sendIce(ice, remoteUser) {
        this.sendMessage(
            new IceMessage(this._currentSessionId, remoteUser, ice)
        );
        this.dispatch('ice.sent', ice);
    }

    sendSdp(sdp, remoteUser) {
        this.sendMessage(
            new SdpMessage(this._currentSessionId, remoteUser, sdp)
        );
        if(sdp.type === Sdp.types.OFFER) {
            this.dispatch('offer.sent', sdp);
        } else {
            this.dispatch('answer.sent', sdp);
        }
        this.dispatch('sdp.sent', sdp);
    }

    get hasSignalingConnection() {
        return true;
    }

    /**
     * Produce Message object from JSON data. Event 'message.received' is dispatched.
     *
     * @param {Object} jsonMessage JSON object with message data
     * @protected
     */
    _receiveMessage(jsonMessage) {
        const message = MessageFactory.createFromJson(jsonMessage);
        this.dispatch('message.received', { message });
        if(this._config.debug.recvMessages) {
            console.log('received message', message);
        }
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
            case 'session.data':
                this._sessionData(message);
                break;
            case 'session.stop':
                this._sessionStop(message);
                break;
            case 'session.leave':
                this._sessionLeave(message);
                break;
            case 'session.close':
                this._sessionClose(message);
                break;
            case 'sdp.transfer':
                this._sdpReceived(message);
                break;
            case 'ice.candidate':
                this._iceReceived(message);
                break;
            case 'chat.message':
                this._chatMessage(message);
                break;
            case 'user.communication':
                this._userCommunication(message);
                break;
            case 'success':
                this._handleSuccess(message);
                this.dispatch('result.success', { message });
                break;
            case 'error':
                this.dispatch('result.error', { message });
                break;
        }
    }

    _handleSuccess(message) {
        switch (this._state) {
            case this.states.CONNECTING:
                this._state = this.states.CONNECTED;
                if(!this.currentUser.id && !!message.data.details.user.id) {
                    this._currentUser.id = message.data.details.user.id;
                }
                this.dispatch('user.connected', { user: this._currentUser });
                break;
            case this.states.DISCONNECTING:
                this._state = this.states.DISCONNECTED;
                this.dispatch('user.disconnected', { user: this._currentUser });
                break;
            default:

        }
    }

    _userInit(sourceUser) {
        this._currentUser.connectionId = sourceUser.connectionId;
        this._state = this.states.CONNECTING;
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
        message.data.decidedBy = this._currentUser;
        this.sendMessage(message);
    }

    _sessionConfirm(message) {
        const { sessionId, user } = message;
        this.dispatch('session.confirmed', { sessionId, user });
    }

    _sessionReject(message) {
        const { sessionId, user } = message;
        const { decidedBy } = message.data;
        this.dispatch('session.rejected', { sessionId, user, decidedBy });
    }

    _sessionData(message) {
        this._currentSessionId = message.data.session.id;
        this.dispatch('session.joined', { session: message.data.session });
    }

    _sessionStop(message) {
        const { sessionId, user } = message;
        this.dispatch('session.request.stopped', { sessionId, user });
    }

    _sessionLeave(message) {
        const { sessionId, user } = message;
        if(user.id === this._currentUser.id) {
            this.dispatch('session.left', { sessionId, user });
        } else {
            this.dispatch('session.left.user', { sessionId, user });
        }
    }

    _sessionClose(message) {
        const { sessionId, user } = message;
        this.dispatch('session.closed', { sessionId, user });
    }

    _sdpReceived(message) {
        const { sessionId, user, sdp } = message;
        let type;
        if(sdp.type === Sdp.types.OFFER) {
            type = 'offer.received';
        } else {
            type = 'answer.received';
        }
        this.dispatch(type, { sessionId, user, sdp });
        this.dispatch('sdp.received', { sessionId, user, sdp });
    }

    _iceReceived(message) {
        const { sessionId, user, ice } = message;
        this.dispatch('ice.received', { sessionId, user, ice });
    }

    _chatMessage(message) {
        this.dispatch('chat.message', { message });
    }

    _userCommunication(message) {
        const { details, sender } = message;
        this.dispatch('user.communication', { details, sender });
    }

    _connectionLost() {
        this.dispatch('connection.lost');
    }

    _connectionClosed() {
        this.dispatch('connection.closed');
    }

    /**
     * Add new handler to specified event
     *
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

    /**
     *
     * @returns {*}
     */
    get events() {
        return this._events;
    }

    get currentUser() {
        return this._currentUser;
    }

    get currentSessionId() {
        return this._currentSessionId;
    }

    get state() {
        return this._state;
    }

    /**
     * Return built-in events
     *
     * @returns {string[]} Built-in events
     */
    get builtInEvents() {
        return [
            'connection.opened',
            'connection.lost',
            'connection.closed',
            'user.connected',
            'user.disconnected',
            'user.communication',
            'session.created',
            'session.requested',
            'session.request.stopped',
            'session.confirmed',
            'session.rejected',
            'session.joined',
            'session.left',
            'session.left.user',
            'session.closed',
            'chat.message',
            'sdp.sent',
            'offer.sent',
            'offer.received',
            'sdp.received',
            'ice.received',
            'ice.sent',
            'answer.sent',
            'answer.received',
            'message.received',
            'result.success',
            'result.error',
            'signaling.error',
        ]
    }

    get states() {
        return {
            DISCONNECTED: 0,
            CONNECTING: 1,
            CONNECTED: 2,
            DISCONNECTING: 3,
        }
    }
}

export default AbstractSignaling;
