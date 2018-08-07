import _ from 'underscore';
import bowser from 'bowser';
import Compatibility from '../utilities/Compatibility'
import IncorrectConstraint from '../../exceptions/IncorrectConstraint'

/**
 * Object which is responsible for universal definition of user media constraints and checking if these are available on user device
 */
const Constraints = {
    /**
     * It generates set of constraints for video media
     *
     * @method
     * @param {object|null} options It contains list of constraints for video media
     * @returns {object}
     */
    Audio(options = null) {
        if (options === null) {
            options = true;
        } else {
            options = Constraints.filter(options);
        }
        return {
            "audio": options
        };
    },
    /**
     * It generates set of constraints for audio media
     *
     * @method
     * @param {object|null} options It contains list of constraints for audio media
     * @returns {object}
     */
    Video(options = null) {
        if (options === null) {
            options = true;
        } else {
            options = Constraints.filter(options);
        }
        return {
            "video": options
        };
    },
    /**
     * It generates set of constraints for device screen
     *
     * @method
     * @param {object|null} options It contains list of constraints for device screen
     * @returns {object}
     */
    Screen(options = null) {
        if (options === null) {
            options = true;
        }
        const baseOptions = bowser.chrome ? {
            mandatory: {
                chromeMediaSource: 'screen',
                maxWidth: screen.width,
                maxHeight: screen.height,
                minFrameRate: 1,
                maxFrameRate: 5
            },
            optional: []
        } : {
            mediaSource: screen
        };
        const allOptions = (options !== null) ? _.extendOwn(baseOptions, options) : baseOptions;
        return {
            "video": allOptions
        };
    },
    /**
     * List of all constraints which are available on user device
     */
    get available() {
        if (Compatibility.check({
                "chrome": "53",
                "firefox": "44",
                "opera": "40",
                "safari": "11"
            }, true, Compatibility.WARNING) && navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
            return navigator.mediaDevices.getSupportedConstraints();
        } else {
            return null;
        }
    },
    /**
     * It checks if all given constraints for single media type are available on user device
     *
     * @method
     * @param {object} input Set of constraints for single media type
     * @returns {object}
     */
    filter(input) {
        if (Constraints.available !== null) {
            for (const property in input) {
                if (Constraints.available[property] !== true) {
                    console.warn(new IncorrectConstraint(property));
                }
            }
        }
        return input;
    },
    /**
     * It checks if all given constraints for all media types are available on user device
     *
     * @method
     * @param {object} input Set of constraints for all media types
     * @returns {object}
     */
    filterAll(constraints) {
        return _.mapObject(constraints, constraint => Constraints.filter(constraint));
    }
};

export default Constraints;