'use strict';

var _       = require('lodash'),
    Model   = require('model-object'),
    Transformer = require('./transformer');

module.exports = {
    init : init
};

/**
 * Creates a new application state and exposes the methods to modify and track it.
 * @returns {stateMethods}
 */
function init(options) {

    options = options || {};

    var ModelUsed = options.Model || Model,
        setting = {
            ongoing : false,
            devTools : !!options.devTools,
            allowConcurrent : !!options.allowConcurrent
        },
        state = {
            model : new ModelUsed({ data : options.data || {}}),
            subscribers : []
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
        unsubscribe : unsubscribe.bind(state),
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
 * @param ...path {string}
 * @param subscriber {object}
 * @returns {number}
 */
function subscribe() {
    var length = arguments.length,
        subscriber,
        args = [].slice.call(arguments),
        self = this,
        paths = args.slice(0, length - 1);

        // Add data. to the path to support root level subscriptions
        // Do it now, so it only needs to be done once
        paths = _.map(paths, function(path) {
            return getPath(path);
        });

        subscriber = {
            callback : arguments[length - 1],
            paths : paths
        };

        self.subscribers.push(subscriber);
}

/**
 * Unsbuscribe using the same signature as subscribe
 * @param {...}
 * @param subscriber
 */
function unsubscribe() {
    var length = arguments.length,
        subscriber,
        args = [].slice.call(arguments),
        paths = args.slice(0, length - 1);

    // Add data. to the path to support root level subscriptions
    // Do it now, so it only needs to be done once
    paths = _.map(paths, function(path) {
        return getPath(path);
    });

    subscriber = {
        callback : arguments[length - 1],
        paths : paths
    };

    this.subscribers = _.filter(this.subscribers, function(thisSubscriber) {
        var keep = false;

        if (thisSubscriber.callback !== subscriber.callback) {
            keep = true;
        }

        if (!_.isEqual(thisSubscriber.paths, subscriber.paths)) {
            keep = true;
        }

        return keep;
    });
}

/**
 * Return the number of subscribers on a path.
 * @param path {string}
 * @returns {number}
 */
function subscribers(path) {
    return _.reduce(this.subscribers, function(total, subscriber) {
        var found = _.find(subscriber.paths, function(thePath) {
            return getOriginalPath(thePath) === path;
        });

        return found ? ++total : total;
    }, 0);
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
    if (setting.ongoing && !setting.allowConcurrent) {
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
function transform(key) {
    return new Transformer(key, this);
}

function transformr(key, callback) {
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


    // TODO: loop in a loop - try to optimize
    _.forEach(this.subscribers, function (subscriber) {

        _.forEach(subscriber.paths, function(subscriptionPath) {
            // using [.] vs \\. for readability
            var startsWith = new RegExp('^' + subscriptionPath + '[.]'),
                contains = new RegExp('^' + changedPath + '[.]');

            // Notify if sub path is included in changed path
            if (startsWith.test(changedPath)) {
                tonotify.push(subscriber);

                // Notify if exact match
            } else if (subscriptionPath === changedPath) {
                tonotify.push(subscriber);

                // Notify if set path is included in subscription path
            } else if (contains.test(subscriptionPath)) {
                tonotify.push(subscriber);
            }
        });
    });

    _.uniq(tonotify).forEach(function (subscriber) {
        var pathsResults = _.map(subscriber.paths, function(path) {
            return instance.get(getOriginalPath(path));
        });
        // Need to slice off "data."
        subscriber.callback.apply(self, pathsResults);
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

function getOriginalPath(path) {
    return path.slice(5);
}
