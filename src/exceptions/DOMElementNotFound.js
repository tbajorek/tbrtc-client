import Translation from 'tbrtc-common/translate/Translation';

class DOMElementNotFound extends Error {
    constructor(delem) {
        super(Translation.instance._('DOM element {delem} is not found', {
            "delem": delem,
        }));
    }
}

export default DOMElementNotFound;