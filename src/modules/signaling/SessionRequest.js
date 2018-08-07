import { Session as SessionMessage } from 'tbrtc-common/messages/Session';

/**
 * Model of session request service.
 * It can simplify process of taking decision what to do with session request.
 */
class SessionRequest {
    /**
     * Initialization of session request
     *
     * @param {SessionMessage} requestMessage Session message with join request's data
     * @param {function} decidedCallback Callback to handle result.
     * Message with generated response is passed in the argument.
     */
    constructor(requestMessage, decidedCallback) {
        this._requestMessage = requestMessage;
        this._responseMessage = null;
        this._decidedCallback = decidedCallback;
    }

    /**
     * It agrees on joining to the session by the author of request
     *
     * @returns {SessionRequest}
     */
    confirm() {
        this._prepateResponseMessage('session.confirm');
        this._decidedCallback(this.responseMessage);
        return this;
    }

    /**
     * It rejectes the session join request
     *
     * @returns {SessionRequest}
     */
    reject() {
        this._prepateResponseMessage('session.reject');
        this._decidedCallback(this.responseMessage);
        return this;
    }

    /**
     * Factory of response messages.
     * It automatically generate response message with the given type
     * which is compatible with data given in request.
     *
     * @param {string} type Type of response message
     * @private
     */
    _prepateResponseMessage(type) {
        this._responseMessage = new SessionMessage(
            type,
            this._requestMessage.sessionId,
            this._requestMessage.user
        );
    }

    /**
     * Message with request data
     *
     * @readonly
     * @property
     * @type {SessionMessage}
     */
    get requestMessage() {
        return this._requestMessage;
    }

    /**
     * Message with response data. It's available only after the user take a decision about the request.
     *
     * @readonly
     * @property
     * @type {SessionMessage|*}
     */
    get responseMessage() {
        return this._responseMessage;
    }
}

export default SessionRequest;
