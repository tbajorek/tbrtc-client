import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import Information from '../../media/Information';
import WsWrongState from '../../../exceptions/WsWrongState'
import FunctionalityNotSupported from '../../../exceptions/FunctionalityNotSupported'

/**
 * Wrapper for original WebSocket class
 */
class WebSocketClient {
    /**
     * Initialization of WebSocket connection
     *
     * @param url Url to target of the connection
     * @param {string|string[]} protocol Protocol or list of them used by WebSocket
     */
    constructor(url, protocol = undefined) {
        if (!Information.supported.webSocket) {
            throw new FunctionalityNotSupported('WebSocket');
        }
        this._ws = new WebSocket(url, protocol);
    }

    /**
     * It assigns the given handler to specified event
     *
     * @param {string} eventName Name of handled event
     * @param {function} handler Concrete handler for specified event
     */
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

    /**
     * It sends the data to remote host
     *
     * @param {string} data Stringified data to be sent
     * @param {function} callback Function to be executed when data has been sent successfully
     */
    send(data, callback = undefined) {
        if(typeof data !== 'string') {
            throw new BadParamType('data', 'WebSocketWrapper.send', 'string');
        }
        if(typeof callback !== 'undefined' && typeof callback !== 'function') {
            throw new BadParamType('callback', 'WebSocketWrapper.send', 'function');
        }
        if(this._ws.readyState !== WebSocket.OPEN) {
            throw new WsWrongState('OPEN', this._ws.readyState);
        }
        this._ws.send(data, undefined, callback);
    }

    /**
     * It closes the connection if it's not yet closed
     *
     * @param {number} code Status code with information about reason of closing the connection
     * @param {string} reason String with information about reason of closing the connection
     */
    close(code = undefined, reason = undefined) {
        if(this._ws !== null) {
            this._ws.close(code, reason);
            this._ws = null;
        }
    }

    /**
     * It terminates the connection
     */
    terminate() {
        this.close();
    }

    /**
     * Original WebSocket connection object
     *
     * @property
     * @readonly
     * @type {WebSocket|null}
     */
    get connection() {
        return this._ws;
    }

    get connectionState() {
        return this._ws.readyState;
    }

    /**
     * List of all available events which can be handled
     *
     * @property
     * @readonly
     * @type {string[]}
     */
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
