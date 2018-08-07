import Translation from 'tbrtc-common/translate/Translation';

class UserIsOffline extends Error
{
    constructor() {
        super(Translation.instance._('You are offline. Check your internet connection or turn off offline mode in your browser.'));
    }
}

export default UserIsOffline;
