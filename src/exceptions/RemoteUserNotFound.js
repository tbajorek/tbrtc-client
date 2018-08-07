import Translation from 'tbrtc-common/translate/Translation';

class RemoteUserNotFound extends Error
{
    /**
     * 
     * @param {string} luser 
     * @param {string} ruser 
     */
    constructor(ruser) {
        super(Translation.instance._('Remote user with id {ruser} has not been found', {
            "luser": luser
        }));
    }
}

export default RemoteUserNotFound;