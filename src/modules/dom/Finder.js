import fnd from 'fnd';
import DOMElementNotFound from '../../exceptions/DOMElementNotFound';

/**
 * Tool to finding DOM elements which is compatible with the given query and which is located in parent element
 */
class Finder {
    /**
     * It looks for DOM elements inside parent container which can be matched to given query
     *
     * @param {string} query Given criteria of matching. It's the same like used in CSS-selectors.
     * @param {Element|null} parent Parent container
     * @param {boolean} first Flag if only first element or all should be returned
     * @returns {Element[]|Element}
     */
    static find(query, parent = null, first = true) {
        if (parent === null) {
            parent = document;
        }
        /**
         * @type {Element[]} found
         */
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