import Translation from 'tbrtc-common/translate/Translation';

class MediaRequestIsDone extends Error
{
    constructor() {
        super(Translation.instance._('Media request has been already done. Please refresh page before doing it again.'));
    }
}

export default MediaRequestIsDone;
