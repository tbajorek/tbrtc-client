import BadParamType from 'tbrtc-common/exceptions/BadParamType'
import AbstractSignaling from './AbstractSignaling'

import WebSocketClient from './WebSocket/WebSocketClient';
import WebSocketError from "../../exceptions/WebSocketError";

/**
 * Concrete implementation of signaling mechanism based on WebSocket technology
 */
class Socket extends AbstractSignaling
{
    _initialize() {
        this._connection = null;
        this._closing = false;
    }

    _connect() {
        this._connection = new WebSocketClient(this._config.server);
        this._connection.on('error', (error) => {
            this.dispatch('signaling.error', { error: new WebSocketError(error) });
        });
        this._connection.on('connection', (connection) => {
            this.dispatch('connection.opened', { connection: this._connection });

            connection.on('message', (message) => {
                this._receiveMessage(message);
            });
            connection.on('close', () => {
                if(this._closing) {
                    this._connectionClosed();
                } else {
                    this._connectionLost();
                }
            });
        });
    }

    _send(message) {
        if(typeof message !== 'string') {
            throw new BadParamType('message', 'modules/signaling/Socket._send', 'string');
        }
        this._connection.send(message);
    }

    close() {
        if(this._connection !== null && !this._closing) {
            this._closing = false;
            this._connection.close();
            this._connection = null;
            this.dispatch('connection.closed');
        }
    }
}

export default Socket;
