'use strict';

module.exports = {
    init : init
};

function init() {
    var data = {
            data : {

            }
        },
        subscriptions = [];

    return {
        get         : get.bind(null, data),
        set         : set.bind(null, data),
        subscribe   : subscribe.bind(null, subscriptions)
    }
}

function subscribe() {

}

function get(obj, desc) {
    var arr;

    if (!desc) {
        return obj;
    }

    arr = desc.split('.');
    while(arr.length && obj) {
        // will work with arrays
        obj = obj[arr.shift()];
    }

    return obj;
}

function set(data, desc, value) {
    var arr,
        item,
        obj = data;

    arr = desc.split('.');
    while(arr.length > 1) {
        item = arr.shift();
        if (!obj[item]) {
            // will not work with arrays
            obj[item] = {};
        }
        obj = obj[item];
    }

    obj[arr.shift()] = value;

    return data;
}