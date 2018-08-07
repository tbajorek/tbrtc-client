import Translation from 'tbrtc-common/translate/Translation';

class FileInfoNotExist extends Error
{
    constructor(chnumber, fname) {
        super(Translation.instance._('You are trying to add chunk number {chnumber} of file {fname} to file without information about itself', {
            "chnumber": chnumber,
            "fname": fname,
        }));
    }
}

export default FileInfoNotExist;
