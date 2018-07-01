import Translation from 'tbrtc-common/translate/Translation';

class FunctionalityNotSupported extends Error
{
    constructor(fname) {
        super(Translation.instance._('The functionality {fname} is not supported by your browser', {
            "fname": fname
        }));
    }
}

export default FunctionalityNotSupported;