import Translation from 'tbrtc-common/translate/Translation';

class TrackNotFound extends Error
{
    constructor(index, kind) {
        super(Translation.instance._('Track {index} of type {kind} does not exist', {
            "index": index,
            "kind": kind
        }));
    }
}

export default TrackNotFound;