import fnd from 'fnd';
import DOMElementNotFound from '../../exceptions/DOMElementNotFound';

class Finder {
    static find(query, parent = null, first = false) {
        if (parent === null) {
            parent = document;
        }
        const found = fnd(query, parent);
        switch (found.length) {
            case 0:
                throw new DOMElementNotFound(query);
            case 1:
                return found[0];
            default:
                if (first) {
                    return found[0];
                } else {
                    return found;
                }
        }
    }
}

export default Finder;