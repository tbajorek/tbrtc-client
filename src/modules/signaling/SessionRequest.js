import { Session as SessionMessage } from 'tbrtc-common/messages/Session';

class SessionRequest {
    constructor(requestMessage, decidedCallback) {
        this._requestMessage = requestMessage;
        this._responseMessage = null;
        this._decidedCallback = decidedCallback;
    }

    confirm() {
        this._prepateResponseMessage('session.confirm');
        this._decidedCallback(this.responseMessage);
        return this;
    }

    reject() {
        this._prepateResponseMessage('session.reject');
        this._decidedCallback(this.responseMessage);
        return this;
    }

    _prepateResponseMessage(type) {
        this._responseMessage = new SessionMessage(
            type,
            this._requestMessage.sessionId,
            this._requestMessage.user
        );
    }

    get requestMessage() {
        return this._requestMessage;
    }

    get responseMessage() {
        return this._responseMessage;
    }
}

export default SessionRequest;
