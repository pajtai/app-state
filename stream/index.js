'use strict';

var _ = require('lodash'),
    H = require('highland'),
    AppState = require('../index');

module.exports = {
    init : init
};

function init(options) {
    var appStateStream = AppState.init(options);
    appStateStream.stream = stream.bind(appStateStream);
    return appStateStream;
}

/**
 * Subscribe to changes that may affect appState(key...).
 * Subsciption is in the form of a stream.
 * The idea is that the stream can be mapped, filtered, etc.
 * @param {...}
 * @returns {Stream|*}
 */
function stream() {
    var self = this,
        args = [].slice.call(arguments),
        subscriptionStream = H();

    args.push(function() {
        var args2 = [].slice.call(arguments);
        subscriptionStream.write(args2);
    });

    this.subscribe.apply(this, args);

    // Remove callback
    args.pop();

    subscriptionStream.write(_.map(args, function(key) {
        return self(key);
    }));

    return subscriptionStream;
}
