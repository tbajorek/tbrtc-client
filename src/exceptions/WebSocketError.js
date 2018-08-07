import Translation from 'tbrtc-common/translate/Translation';

class WebSocketError extends Error
{
    constructor(details) {
        super(Translation.instance._('An error with Web Socket communication occured'));
        this._details = details;
    }

    get details() {
        return this._details;
    }
}

export default WebSocketError;
