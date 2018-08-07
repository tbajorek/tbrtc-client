import Translation from 'tbrtc-common/translate/Translation';

class UserHasSession extends Error
{
    constructor(sid) {
        super(Translation.instance._('The local user is already a member of session {sid}', {
            sid
        }));
    }
}

export default UserHasSession;