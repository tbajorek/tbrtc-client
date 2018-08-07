import Translation from 'tbrtc-common/translate/Translation';

class FileIsNotLoaded extends Error
{
    constructor() {
        super(Translation.instance._('File is not loaded from disc so it can not be chunkified'));
    }
}

export default FileIsNotLoaded;
