import Translation from 'tbrtc-common/translate/Translation';

class IncorrectSentDataType extends Error
{
    constructor(cid, uname) {
        super(Translation.instance._('The given type of SentData is incorrect. Probably you used wrong conditions to choose it.', {
            "cid": cid,
            "uname": uname
        }));
    }
}

export default IncorrectSentDataType;
