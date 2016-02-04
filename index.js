'use strict';

var _ = require('lodash'),
    Model = require('model-object');

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
            model : Model({}),
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

    if (setting.devTools && global.addEventListener) {
        try {
            global.appState = instance;
            global.addEventListener('change-app-state-from-panel', function (event) {
                instance('', event.detail);
            });
        } catch (e) {
            console.log('add event listener error', e);
        }

    }

    // This seems overly complicated
    return _.extend(instance, {
        get         : get.bind(state),
        set         : set.bind(state, setting, instance),
        transform   : transform.bind(instance),
        subscribe   : subscribe.bind(state),
        subscribers : subscribers.bind(state),
        calculations: calculations.bind(state)
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
 * An object of calculations to run after each set.
 * The keys are the paths to set.
 * The values should be callbacks that return the value to set.
 * @param calcs
 */
function calculations(calcs) {
    var newCalcs = {};

    this._calcs = calcs;

    _.forEach(calcs, function(value, key) {
        var newPath = getPath(key);
        newCalcs[newPath] = function() {
            return value.apply(this, arguments);
        };
    });
    this.model.calculations(newCalcs);
    return this;
}

/**
 * Get the value on a path. Returns undefined if can't find it.
 * @param path {string}
 * @returns {*}
 */
function get(path) {
    return this.model.get(getPath(path));
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

    var originalPath,
        self = this;

    path = getPath(path);
    originalPath = path;

    // Cannot set while another set is in progress
    if (setting.ongoing) {
        throw new Error('Cannot set while another set is in progress.');
    }

    setting.ongoing = true;

    this.model.set(path, value);

    notifySubscribers.call(this, originalPath, setting, instance);

    // This should be cleaned up to only notify if changed, but for now, notify all subscribers
    if (this._calcs) {
        _.forEach(this._calcs, function (value, key) {

            // The actual caclculations are done by the backing model-object
            notifySubscribers.call(self, getPath(key), setting, instance);
        });
    }

    setting.ongoing = false;

    return this;
}

/**
 * Pass in the key for the value to change, and the callback that will change it, along with the varargs to call the
 * callback with.
 * The callback will be called with the value for the key followed by the varargs. The context is null.
 *
 * This method can be used to create easily unit testable transforms to store logic as to how the appState is allowed
 * to be updated.
 * @param key
 * @param callback
 * @param {...}
 */
function transform(key, callback) {
    var varargs = [].splice.call(arguments, 2),
        result;

    varargs.unshift(this.get(key));

    result = callback.apply(null, varargs);
    this.set(key, result);
    return result;
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
    if (setting.devTools && global.dispatchEvent && global.CustomEvent) {
        try {
            global.dispatchEvent(new global.CustomEvent('change-app-state', { detail : instance()} ));
        } catch (e) {
            console.log('dispatch error', e);
        }
    }

    return this;
}

function getPath(path) {
    return path ? 'data.' + path : 'data';
}