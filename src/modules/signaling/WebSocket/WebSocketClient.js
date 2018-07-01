import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import FunctionalityNotSupported from '../../../exceptions/FunctionalityNotSupported'

class WebSocketClient {
    constructor(url, protocol = undefined) {
        if (typeof window === 'undefined' || !("WebSocket" in window)) {
            throw new FunctionalityNotSupported('WebSocket');
        }
        this._ws = new WebSocket(url, protocol);
    }

    on(eventName, handler) {
        if(this.availableEvents.indexOf(eventName) < 0) {
            throw new BadParamType('eventName', 'WebSocketWrapper.on', 'WebSocketWrapper.availableEvents');
        }
        switch (eventName) {
            case 'connection':
                this._ws.onopen = () => { handler(this); };
                break;
            case 'message':
                this._ws.onmessage = (e) => { handler(e.data); };
                break;
            default:
                this._ws['on'+eventName] = handler;
        }
    }

    send(data) {
        if(typeof data !== 'string') {
            throw new BadParamType('data', 'WebSocketWrapper.send', 'string');
        }
        this._ws.send(data);
    }

    close(code = undefined, reason = undefined) {
        if(this._ws !== null) {
            this._ws.close(code, reason);
            this._ws = null;
        }
    }

    terminate() {
        this.close();
    }

    get connection() {
        return this._ws;
    }

    get availableEvents() {
        return [
            'connection',
            'message',
            'error',
            'close'
        ]
    }
}

export default WebSocketClient;
