# app-state
v1.0.0

[![Build Status](https://travis-ci.org/pajtai/app-state.svg?branch=master)](https://travis-ci.org/pajtai/app-state)

A place to store the object that represents your app state. You can create subscriptions, set, and get paths.

[Chrome extension](https://github.com/Duder-onomy/app-state-chrome-extension)

![appstate-live-update](https://cloud.githubusercontent.com/assets/1643937/12075681/b1d5caba-b13c-11e5-8c8e-54eb239bcb93.gif)

## Usage

Create a new app state object:

```javascript
var state = require('app-state').init();
```


### Init: `require('app-state').init([ options ])` - returns state

Available options:

`options.devTools` - set this truthy if you want to use the [dev tools Chrome Extension](https://github.com/Duder-onomy/app-state-chrome-extension)

## Instance Methods

### Set:
* `state(path, value)` - returns state
* `state.set(path, value)` - returns state

You can use the named method or the shortcut method that is the state instance itself.

```javascript
state.set('user.profile', { library : library });
```

You can set paths that don't exist yet. Empty objects will be created. Only empty objects
will be created, not arrays.

Subscription notifications are run after setting.

### Get:
* `state.get(path)` - returns value
* `state(path)` - returns value

You can use the named method or the shortcut method that is the state instance itself.

```javascript
state.get('user.library.book.4');
```

Will return `undefined` if the path doesn't have objects on it.

Can access items in an array using index numbers with the dot notation.

### Subscribe: `state.subscribe(path..., callback)` - returns state

Subscribe for change events to one or many keys with a callback. Callback is called with the state as context and key values as arugments

```javascript
state.subscribe('user.profile.library', 'player.hdCapable', function(library, hdCapable) { ... });
```

Subscriptions get called on any set that can potentially change them, whether it does or not.
Can subscribe to properties that do not yet exist.

The `user.profile.library` subscription gets notified for any of the following set paths:

* `user.profile.library`
* `user`
* `user.profile.library.public`

The `user.profile.library` subscription does not get notified for any of the following set paths:

* `api`
* `user.profile.notifications`

### Unsubscribe: `state.unsubscribe(path..., callback)` - returns state

Unsubscribe from changes on the specified path or paths with the specified callback. Must match both all paths and callback of a subscribe to unsubscribe

```javascript
state.unsubscribe('user.profile.library', callback);
```

### Subscribers: `state.subscribers(path)` - returns length

Returns number of subscribers on an exact path. Doesn't count longer or shorter paths. Callbacks are counted even if found path is one of many.

### Transform: `state.transform(key, transformFunction, varargs...)` - returns the new value that was set

The transform function is called with `state.get(key)` followed by the varargs.

Calling transform is equivalent to:

```javascript
state.set(key, transformFunction(state.get(key), ...));
```

This method allows a collection of transform calls to represent allowed ways to update the state. Since these calls
 can be implemented as simple input / output with no side effects, it allows easy testing as well.

## Theory

The idea behind having an app state is that it is a unified event channel to communicate
actions through the app. Views can subscribe to the paths that inform them. Models or their agents
can trigger sets as they acquire new information. Models can also subscribe to app state
changes to react to changes with business logic.

Having a central communication hub allows the modularization of apps and the adding and
modification of features and business logic easily. The app state doesn't contain any
business logic itself, just the Model layer should have that.

To keep things simple you cannot run a set while another one is running.

Having a central app state means you can recreate a user scenario by simply saving serialized snapshots of app state.

There are many ways to incorporate app state into an app. You will probably have data transforms both going into and coming
out of app state. The transforms going in is part of the contract of how app state is allowed to change. The transforms
coming out of app state will often be necessitated by how the state is consume by things like view models.

## Release Notes

- 1.0.0
    - Can subscribe to multiple keys with one callback
    - Subscribe callbacks are called with the values of keys subscribed
    - **Incompatibility**: Removed computed values, since these should be handle as transforms going in to app-state or transforms coming out of app-state
    
