import Translation from 'tbrtc-common/translate/Translation';

class ExistedDataChannel extends Error
{
    constructor(cid, uname) {
        super(Translation.instance._('The data channel (id: {cid}) to user {uname} already exists', {
            "cid": cid,
            "uname": uname
        }));
    }
}

export default ExistedDataChannel;
