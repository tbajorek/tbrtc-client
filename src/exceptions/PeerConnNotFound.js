import Translation from 'tbrtc-common/translate/Translation';

class PeerConnNotFound extends Error
{
    constructor(luser, ruser) {
        super(Translation.instance._('User {luser} does not have connection to user with id {ruser}', {
            "luser": luser,
            "ruser": ruser
        }));
    }
}

export default PeerConnNotFound;