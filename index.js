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

    var setting = {
            ongoing : false
        },
        state = {
            data : {},
            subscribers : {}
        },
        /**
         * @typedef {object} stateMethods
         */
        methods = {
            get         : get.bind(state),
            set         : set.bind(state, setting),
            subscribe   : subscribe.bind(state),
            subscribers : subscribers.bind(state)
        };

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
    return this;
}

/**
 * Return the number of subscribers on a path.
 * @param path {string}
 * @returns {number}
 */
function subscribers(path) {
    return undefined === this.subscribers[path] ? 0 : this.subscribers[path].length;
}

/**
 * Get the value on a path. Returns undefined if can't find it.
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
 * Set the value on a path. Creates empty objects on the way down if they don't exist.
 * @param path
 * @param value
 * @returns {object}
 */
function set(setting, // This variable is bound
             path, value) {
    var arr,
        item,
        originalPath = path,
        obj = this.data;

    // Cannot set while another set is in progress
    if (setting.ongoing) {
        throw new Error('Cannot set while another set is in progress.');
    }

    setting.ongoing = true;

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

    setting.ongoing = false;

    return this;
}

function notifySubscribers(changedPath) {

    var self = this;

    _.forEach(this.subscribers, function(subscribers, subscriptionPath) {

        // using [.] vs \\. for readability
        var startsWith = new RegExp('^' + subscriptionPath + '[.]'),
            contains = new RegExp('^' + changedPath + '[.]');

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

    return this;
}