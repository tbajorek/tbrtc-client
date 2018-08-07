import Translation from 'tbrtc-common/translate/Translation';

class DataChannelNotOpened extends Error
{
    constructor(chid, chunkid, fname, rname) {
        super(Translation.instance._('Data channel {chid} is not opened. It can be used to send chunk {chunkid} of file {fname} to remote user {rname}.', {
            chid,
            chunkid,
            fname,
            rname
        }));
    }
}

export default DataChannelNotOpened;
