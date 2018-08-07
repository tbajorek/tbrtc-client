import Translation from 'tbrtc-common/translate/Translation';

class WsWrongState extends Error
{
    constructor(sname, cnumber) {
        let cname;
        switch (cnumber) {
            case WebSocket.CONNECTING:
                cname = 'CONNECTING';
                break;
            case WebSocket.OPEN:
                cname = 'OPEN';
                break;
            case WebSocket.CLOSING:
                cname = 'CLOSING';
                break;
            case WebSocket.CLOSED:
                cname = 'CLOSED';
                break;
            default:
                cname = '<undefined>';
        }

        super(Translation.instance._('The state of WebSocket connection: {cname}({cnumber}) is not {sname}', {
            "sname": sname,
            "cnumber": cnumber,
            "cname": cname
        }));
    }
}

export default WsWrongState;