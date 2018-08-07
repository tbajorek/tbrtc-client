import Translation from 'tbrtc-common/translate/Translation';

class ChannelAlreadyExists extends Error
{
    constructor(chid, lname, rname) {
        super(Translation.instance._('Data channel {chnumber} already exists between users: {luser} and {ruser}', {
            chid,
            lname,
            rname
        }));
    }
}

export default ChannelAlreadyExists;
