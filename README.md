# app-state
v2.0.1

[![Build Status](https://travis-ci.org/pajtai/app-state.svg?branch=master)](https://travis-ci.org/pajtai/app-state)

A place to store the object that represents your app state. You can create subscriptions, set, and get paths.
Use on the server as is, or in the browser with browserify. 

Download : https://www.npmjs.com/package/app-state - `npm install --save app-state`

Docs : http://documentup.com/pajtai/app-state

[Chrome extension](https://github.com/Duder-onomy/app-state-chrome-extension)

![appstate-live-update](https://cloud.githubusercontent.com/assets/1643937/12075681/b1d5caba-b13c-11e5-8c8e-54eb239bcb93.gif)

## Usage

Create a new app state object:

```javascript
var state = require('app-state').init();
```

## Usage with Streams

Create a new app state object with streaming support:

```javascript
var state = require('app-state/stream').init()
```

## A note on dependencies

Highland is dependency that only gets required if you choose to use streaming support with `require('app-state/stream')`. If considering the size of this package on the front end, this would be a consideration.

### Init

* `require('app-state').init([ options ])` - returns state

Available options:

* `options.data` - The data to initialize appState with.
* `options.Model` - if this option is passed in, AppState will use this model as a backer ( `appState.model = options.Model(options.data || {})` )
* `options.devTools` - set this truthy if you want to use the [dev tools Chrome Extension](https://github.com/Duder-onomy/app-state-chrome-extension)
* `options.allowConcurrent` - set this to truthy if you want to be able to make multiple concurrent set calls

## Instance Methods

### Set

* `state(path, value)` - returns state
* `state.set(path, value)` - returns state

You can use the named method or the shortcut method that is the state instance itself.

```javascript
state.set('user.profile', { library : library });
```

You can set paths that don't exist yet. Empty objects will be created. Only empty objects will be created, not arrays.

Subscription notifications are run after setting.

### Get

* `state.get(path)` - returns value
* `state(path)` - returns value

You can use the named method or the shortcut method that is the state instance itself.

```javascript
state.get('user.library.book.4');
```

Will return `undefined` if the path doesn't have objects on it.

Can access items in an array using index numbers with the dot notation.

### Subscribe

* `state.subscribe(path..., callback)` - returns state

Subscribe for change events to one or many keys with a callback. Callback is called with the state as context and key values as arugments

```javascript
state.subscribe('user.profile.library', 'player.hdCapable', function(library, hdCapable) { ... });
```

Subscriptions get called on any set that can potentially change them, whether it does or not. Can subscribe to properties that do not yet exist.

The `user.profile.library` subscription gets notified for any of the following set paths:

* `user.profile.library`
* `user`
* `user.profile.library.public`

The `user.profile.library` subscription does not get notified for any of the following set paths:

* `api`
* `user.profile.notifications`

### Unsubscribe

* `state.unsubscribe(path..., callback)` - returns state

Unsubscribe from changes on the specified path or paths with the specified callback. Must match both all paths and callback of a subscribe to unsubscribe

```javascript
state.unsubscribe('user.profile.library', callback);
```

### Subscribers

* `state.subscribers(path)` - returns length

Returns number of subscribers on an exact path. Doesn't count longer or shorter paths. Callbacks are counted even if found path is one of many.

### Transform

* `state.transform(key).with(transformFunction).using(varargs...)`

`state.trasnform` returns an object you can call `with` and `using` on in either order. The transformation is only completed
after both are called.

The transform function is called with stat.get(key) and the varargs:

```javascript
state.transform('user').with(function(user, favoriteColor, favoriteDrink) { ... }).using('green', 'White Russian');
```

Calling transform is equivalent to:

```javascript
state.set(key, transformFunction(state.get(key), ...));
```

This method allows a collection of transform calls to represent allowed ways to update the state. Since these calls can be implemented as simple input / output with no side effects, it allows easy testing as well.
 
### Stream

(only available via `var state = require('app-state/stream').init()` )

* `state.stream(key...)` - returns [highland](http://highlandjs.org) stream.

Allows you to subscribe to appState changes in the form of a stream. A stream is returned that is only written to when a subscription for the passed in key or keys would run. The value written to the stream is an array of the values subscribed to.

```javascript
var appState = require('app-state/stream').init();
    
appState
    .stream('user', 'library')
    .filter(function(data) {
        var user = data[0];
        return user.authorized;
    })
    .each(function(data) {
        console.log('user', data[0]);
        console.log('library', data[1]);
    });
```

Making use of streaming allows the managing of app state updates with functional methods. So you can map, filter, reduce, etc. your app state updates.

## Theory

The idea behind having an app state is that it is a unified event channel to communicate actions through the app. Views can subscribe to the paths that inform them. Models or their agents can trigger sets as they acquire new information. Models can also subscribe to app state changes to react to changes with business logic.

Having a central communication hub allows the modularization of apps and the adding and modification of features and business logic easily. The app state doesn't contain any business logic itself, just the Model layer should have that.

To keep things simple you cannot run a set while another one is running.

Having a central app state means you can recreate a user scenario by simply saving serialized snapshots of app state.

There are many ways to incorporate app state into an app. You will probably have data transforms both going into and coming out of app state. The transforms going in is part of the contract of how app state is allowed to change. The transforms coming out of app state will often be necessitated by how the state is consume by things like view models.

## Release Notes

- 2.0.0
    - **Incompatability**: Changed signature of `transform`
- 1.0.0
    - Can subscribe to multiple keys with one callback
    - Subscribe callbacks are called with the values of keys subscribed
    - **Incompatibility**: Removed computed values, since these should be handle as transforms going in to app-state or transforms coming out of app-state
    
