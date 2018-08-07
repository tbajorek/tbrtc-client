import Translation from 'tbrtc-common/translate/Translation';

class FileIsNotCompleted extends Error
{
    constructor(fname) {
        super(Translation.instance._('File {fname} is not completed', {
            "fname": fname
        }));
    }
}

export default FileIsNotCompleted;
