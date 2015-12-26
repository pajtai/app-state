'use strict';

var _ = require('lodash');

module.exports = {
    init : init
};

/**
 * Creates a new application state and exposes the methods to modify and track it.
 * @returns {stateMethods}
 */
function init() {

    var state = {
            data : {},
            subscribers : {}
        },
        /**
         * @typedef {object} stateMethods
         */
        methods = {
            get         : get.bind(state),
            set         : set.bind(state),
            subscribe   : subscribe.bind(state)
        };

    methods.subscribe.subscribers = subscribers.bind(state);

    return methods;
}

/**
 * Subscribe to a path. You will be notified of change that can potentially affect your
 * subscription.
 * @param path {string}
 * @returns {number}
 */

/**
 *
 * @param path {string}
 * @param subscriber {object}
 * @returns {number}
 */
function subscribe(path, subscriber) {

    this.subscribers[path] = this.subscribers[path] || [];
    this.subscribers[path].push(subscriber);
    return this.subscribers[path].length;
}

/**
 *
 * @param path {string}
 * @returns {number}
 */
function subscribers(path) {
    return undefined === this.subscribers[path] ? 0 : this.subscribers[path].length;
}

/**
 *
 * @param path {string}
 * @returns {*}
 */
function get(path) {
    var arr,
        data = this.data;

    if (!path) {
        return data;
    }

    arr = path.split('.');
    while(arr.length && data) {
        // will work with arrays
        data = data[arr.shift()];
    }

    return data;
}

/**
 *
 * @param path
 * @param value
 * @returns {object}
 */
function set(path, value) {
    var arr,
        item,
        originalPath = path,
        obj = this.data;

    arr = path.split('.');
    while(arr.length > 1) {
        item = arr.shift();
        if (!obj[item]) {
            // will not work with arrays
            obj[item] = {};
        }
        obj = obj[item];
    }

    obj[arr.shift()] = value;
    notifySubscribers.call(this, originalPath);

    return this.data;
}

function notifySubscribers(changedPath) {

    var self = this;

    _.forEach(this.subscribers, function(subscribers, subscriptionPath) {

        var startsWith = new RegExp('^' + subscriptionPath),
            contains = new RegExp('^' + changedPath);

        // Notify if sub path is included in changed path
        if (startsWith.test(changedPath)) {
            _.forEach(subscribers, function(subscriber) {
                subscriber.call(self, changedPath);
            });

        // Notify if exact match
        } else if (subscriptionPath === changedPath) {
            _.forEach(subscribers, function(subscriber) {
                subscriber.call(self, changedPath);
            });

        // Notify if set path is included in subscription path
        } else if (contains.test(subscriptionPath)) {
            _.forEach(subscribers, function(subscriber) {
                subscriber.call(self, changedPath);
            });
        }
    });


}