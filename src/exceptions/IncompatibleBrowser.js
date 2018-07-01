import Translation from 'tbrtc-common/translate/Translation';
import _ from 'underscore'

class IncompatibleBrowser extends Error
{
    constructor(browsers = null, mobile = null) {
        super(IncompatibleBrowser.prepareMessage(browsers, mobile));
    }

    static createBrowserString(browsers) {
        var names = _.keys(browsers);
        var versions = [];
        for(var i = 0; i< names.length; ++i) {
            versions[versions.length] = names[i] + ': ' + browsers[names[i]];
        }
        return versions.join(', ');
    }

    static prepareMessage(browsers = null, mobile = null) {
        var message = Translation.instance._('You have problems with browser compatibility');
        if(typeof browsers === 'object') {
            message = Translation.instance._('Your browser should be compatible with these: {browsers}', {
                "browsers": IncompatibleBrowser.createBrowserString(browsers)
            });
        }
        if(mobile !== null) {
            if(mobile) {
                message = Translation.instance._('Your browser should be mobile');
            } else {
                message = Translation.instance._('Your browser shouldn\'t be mobile');
            }
        }
        return message;
    }
}

export default IncompatibleBrowser;