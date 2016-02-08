'use strict';

var _h = require('highland');

module.exports = streamMixin;

function streamMixin(appState) {
    appState.stream = stream.bind(appState);
}

/**
 * Subscribe to changes that may affect appState(key).
 * Subsciption is in the form of a stream.
 * The idea is that the stream can be mapped, filtered, etc.
 * @param key
 * @returns {Stream|*}
 */
function stream(key) {
    var self = this,
        subscriptionStream = _h();

    this.subscribe(key, function() {
        subscriptionStream.write(self(key));
    });

    return subscriptionStream;
}
