import Translation from 'tbrtc-common/translate/Translation';

class PeerConnectionNotOpened extends Error
{
    constructor(uname) {
        super(Translation.instance._('Connection to remote user {uname} is not yet ready to be used', {
            "uname": uname
        }));
    }
}

export default PeerConnectionNotOpened;
