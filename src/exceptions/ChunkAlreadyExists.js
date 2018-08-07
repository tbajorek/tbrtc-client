import Translation from 'tbrtc-common/translate/Translation';

class ChunkAlreadyExists extends Error
{
    constructor(chnumber, fname) {
        super(Translation.instance._('Chunk number {chnumber} already exists for the file {fname}', {
            "chnumber": chnumber,
            "fname": fname
        }));
    }
}

export default ChunkAlreadyExists;
