import bowser from 'bowser'
import _ from 'underscore'
import IncompatibleDevice from '../../exceptions/IncompatibleBrowser';

/**
 * Object to provide functionaity to check browser compatibility and report messages about it
 *
 * @type {object}
 */
const Compatibility = {
    /**
     * Code of error reporting level
     *
     * @constant
     * @property
     * @readonly
     */
    ERROR: 1,
    /**
     * Code of warning reporting level
     *
     * @constant
     * @property
     * @readonly
     */
    WARNING: 2,
    /**
     * It checks if user browser is one of the given in parameter
     * and if its version is at least the same as specified there.
     * Result of this checking is returned as boolean value
     *
     * @param {object} browsers List of objects with browser names and versions to satisfy compatibility conditions
     * @param {boolean} visible Flag if compatibility message should be visible in console
     * @param {number} level Level of code reporting: ERROR or WARNING
     * @returns {boolean}
     */
    check(browsers, visible = false, level = Compatibility.ERROR) {
        const keys = _.keys(browsers);
        if (keys.length === 0) {
            return true;
        }
        const result = bowser.check(browsers);
        if (result) {
            return true;
        }

        if (visible) {
            switch (level) {
                case Compatibility.ERROR:
                    console.error(new IncompatibleDevice(browsers));
                    break;
                case Compatibility.WARNING:
                    console.warn(new IncompatibleDevice(browsers));
                    break;
            }
        }
        return false;
    }
};

export default Compatibility;