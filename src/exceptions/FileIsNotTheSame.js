import Translation from 'tbrtc-common/translate/Translation';

class FileIsNotTheSame extends Error
{
    constructor(cname, rname) {
        super(Translation.instance._('File {oname} is collected but {cname} has been received', {
            "cname": cname,
            "rname": rname
        }));
    }
}

export default FileIsNotTheSame;
