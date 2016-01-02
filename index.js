'use strict';

var _ = require('lodash');

module.exports = {
    init : init
};

/**
 * Creates a new application state and exposes the methods to modify and track it.
 * @returns {stateMethods}
 */
function init(options) {

    options = options || {};

    var setting = {
            ongoing : false,
            devTools : !!options.devTools
        },
        state = {
            data : {},
            subscribers : {}
        },
        instance;
    /**
     * @typedef {object} stateMethods
     */
    instance = function() {
        if (arguments.length >= 2) {
            return shortcut.call(state, setting, instance, arguments[0], arguments[1]);
        } else {
            return shortcut.call(state, setting, instance, arguments[0]);
        }
    };

    if (setting.devTools) {
        global.appState = instance;
    }

    return _.extend(instance, {
        get         : get.bind(state),
        set         : set.bind(state, setting, instance),
        subscribe   : subscribe.bind(state),
        subscribers : subscribers.bind(state)
    });
}

function shortcut(setting, instance, // bound variable
                  path, value) {
    // Have to use argument length to be able to set things like shortcut('a.b', false)

    var returned;

    if (arguments.length >= 4) {
        returned =  set.call(this, setting, instance, path, value);
    } else {
        returned = get.call(this, path);
    }
    return returned;
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
 * @param setting
 * @param instance
 * @param path
 * @param value
 * @returns {set}
 */
function set(setting, instance, // This variable is bound
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
    notifySubscribers.call(this, originalPath, setting, instance);
    setting.ongoing = false;

    return this;
}

function notifySubscribers(changedPath, setting, instance) {

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

    // Notify chrome extensions last
    if (setting.devTools && global.dispatchEvent) {
        global.dispatchEvent(new global.CustomEvent('change-app-state', { detail : instance()} ));
    }

    return this;
}

function getPath(path) {
    return path ? 'data.' + path : 'data';
}