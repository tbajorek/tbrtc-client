import Translation from 'tbrtc-common/translate/Translation';

class FilesNotChosen extends Error
{
    constructor(cid, uname) {
        super(Translation.instance._('Any files have not been chosen to be sent', {
            "cid": cid,
            "uname": uname
        }));
    }
}

export default FilesNotChosen;
