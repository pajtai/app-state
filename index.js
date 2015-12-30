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
            data : { },
            subscribers : {}
        };

        /**
         * @typedef {object} stateMethods
         */
    return _.extend(shortcut.bind(state, setting), {
        get         : get.bind(state),
        set         : set.bind(state, setting),
        subscribe   : subscribe.bind(state),
        subscribers : subscribers.bind(state)
    });
}

function shortcut(setting, // bound variable
                  path, value) {
    if (3 <= arguments.length) {
        return set.call(this, setting, path, value);
    } else {
        return get.call(this, path);
    }
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

    path = getPath(path);

    this.subscribers[path] = this.subscribers[path] || [];
    this.subscribers[path].push(subscriber);
}

/**
 * Return the number of subscribers on a path.
 * @param path {string}
 * @returns {number}
 */
function subscribers(path) {
    path = getPath(path);
    return undefined === this.subscribers[path] ? 0 : this.subscribers[path].length;
}

/**
 * Get the value on a path. Returns undefined if can't find it.
 * @param path {string}
 * @returns {*}
 */
function get(path) {
    var arr,
        data = this;

    path = getPath(path);

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
        originalPath,
        obj = this;

    path = getPath(path);
    originalPath = path;

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
}

function notifySubscribers(changedPath) {

    var self = this,
        tonotify = [];


    _.forEach(this.subscribers, function (subscribers, subscriptionPath) {

        // using [.] vs \\. for readability
        var startsWith = new RegExp('^' + subscriptionPath + '[.]'),
            contains = new RegExp('^' + changedPath + '[.]');

        // Notify if sub path is included in changed path
        if (startsWith.test(changedPath)) {
            _.forEach(subscribers, function (subscriber) {
                tonotify.push(subscriber);
            });

            // Notify if exact match
        } else if (subscriptionPath === changedPath) {
            _.forEach(subscribers, function (subscriber) {
                tonotify.push(subscriber);
            });

            // Notify if set path is included in subscription path
        } else if (contains.test(subscriptionPath)) {
            _.forEach(subscribers, function (subscriber) {
                tonotify.push(subscriber);
            });
        }
    });

    _.uniq(tonotify).forEach(function (subscriber) {
        subscriber.call(self, changedPath);
    });
}

function getPath(path) {
    return path ? 'data.' + path : 'data';
}