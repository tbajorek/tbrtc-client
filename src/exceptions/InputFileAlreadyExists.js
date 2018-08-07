import Translation from 'tbrtc-common/translate/Translation';

class InputFileAlreadyExists extends Error
{
    constructor(ifid) {
        super(Translation.instance._('File input with id {ifid} already exists', {
            ifid,
        }));
    }
}

export default InputFileAlreadyExists;
