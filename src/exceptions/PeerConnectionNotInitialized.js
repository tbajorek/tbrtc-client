import Translation from 'tbrtc-common/translate/Translation';

class PeerConnectionNotInitialized extends Error
{
    constructor() {
        super(Translation.instance._('Peer connection is not yet initialized'));
    }
}

export default PeerConnectionNotInitialized;
