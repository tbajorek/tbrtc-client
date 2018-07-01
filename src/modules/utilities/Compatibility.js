import bowser from 'bowser'
import _ from 'underscore'
import IncompatibleDevice from '../../exceptions/IncompatibleBrowser';

const Compatibility = {
    ERROR: 1,
    WARNING: 2,
    check(browsers, visible = false, level = Compatibility.ERROR) {
        var keys = _.keys(browsers);
        if (keys.length === 0) {
            return true;
        }
        var result = bowser.check(browsers);
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