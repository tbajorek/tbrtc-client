'use strict';
var test = require('tape');

require('./modules/config/ConstraintsTest');

test('Shutdown', function(t) {
    require('webrtc-utilities').seleniumLib.buildDriver()
        .then(function(driver) {
            driver.getCapabilities().then(function(caps) {
                // Newer geckodriver do not like close() for some reason.
                if (caps.get('browserName') !== 'firefox') {
                    driver.close();
                }
            });
            driver.quit().then(function() {
                t.end();
            });
        });
});