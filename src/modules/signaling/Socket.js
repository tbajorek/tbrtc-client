import BadParamType from 'tbrtc-common/exceptions/BadParamType'
import AbstractSignaling from './AbstractSignaling'

import WebSocketClient from './WebSocket/WebSocketClient';

class Socket extends AbstractSignaling
{
    _initialize() {
        this._connection = null;
    }

    _connect() {
        this._connection = new WebSocketClient(this._config.server);
        this._connection.on('connection', (connection) => {
            this.dispatch('connection.opened', { connection: this._connection });

            connection.on('message', (message) => {
                this._receiveMessage(message);
            });
            connection.on('close', () => {
                this._connectionClosed();
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
        this._connection.close();
        this.dispatch('connection.closed')
    }
}

export default Socket;
