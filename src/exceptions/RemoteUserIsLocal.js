import Translation from 'tbrtc-common/translate/Translation';

class RemoteUserIsLocal extends Error
{
    /**
     * 
     * @param {string} ruser
     */
    constructor(ruser) {
        super(Translation.instance._('Remote user {ruser} can not be the same as local', {
            "ruser": ruser
        }));
    }
}

export default RemoteUserIsLocal;