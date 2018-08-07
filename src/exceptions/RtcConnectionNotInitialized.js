import Translation from 'tbrtc-common/translate/Translation';

class RtcConnectionNotInitialized extends Error
{
    constructor(opid) {
        super(Translation.instance._('Peer connection is not yet established to remote user, so you can not perform some operations: {opid}', {
            opid
        }));
    }
}

export default RtcConnectionNotInitialized;
