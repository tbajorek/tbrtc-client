import Translation from 'tbrtc-common/translate/Translation';

class AbstractClassUsed extends Error
{
    constructor(cname) {
        super(Translation.instance._('Abstract class {cname} is used. Please choose its non-abstract child.', {
            "cname": cname
        }));
    }
}

export default AbstractClassUsed;
