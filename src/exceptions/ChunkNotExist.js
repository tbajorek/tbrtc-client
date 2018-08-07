import Translation from 'tbrtc-common/translate/Translation';

class ChunkNotExist extends Error
{
    constructor(chnumber, fname) {
        super(Translation.instance._('Chunk numbber {chnumber} of file {fname} does not exist', {
            "chnumber": chnumber,
            "fname": fname,
        }));
    }
}

export default ChunkNotExist;
