import Translation from 'tbrtc-common/translate/Translation';

class IncorrectConstraint extends Error
{
    constructor(cname) {
        super(Translation.instance._('The given constraint {cname} is not available on your device', {
            "cname": cname
        }));
    }
}

export default IncorrectConstraint;