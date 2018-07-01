import Translation from 'tbrtc-common/translate/Translation';

class RemoteUserExists extends Error
{
    /**
     * 
     * @param {string} luser 
     * @param {string} ruser 
     */
    constructor(luser, ruser) {
        super(Translation.instance._('Remote user {ruser} is already connected to {luser}', {
            "luser": luser,
            "ruser": ruser
        }));
    }
}

export default RemoteUserExists;