import Translation from 'tbrtc-common/translate/Translation';

class FileIsEmpty extends Error
{
    constructor(fname) {
        super(Translation.instance._('Any of sent files can not be empty, so you can not send file {fname}', {
            "fname": fname
        }));
    }
}

export default FileIsEmpty;
