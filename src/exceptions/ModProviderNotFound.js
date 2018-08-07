import Translation from 'tbrtc-common/translate/Translation';

class ModProviderNotFound extends Error
{
    constructor(mname, ename) {
        super(Translation.instance._('Module {mname} is not found, so you can not add handler of event {ename}', {
            "mname": mname,
            "ename": ename,
        }));
    }
}

export default ModProviderNotFound;