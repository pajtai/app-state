# app-state
v0.4.0

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

### Subscribe: `state.subscribe(path, callback)` - returns state

Subscribe for change events with a callback. Callback is called with the state as context:

```javascript
state.subscribe('user.profile.library', callback);
```

Subscriptions get called on any set that can potentially change them, whether it does or not.
Can subscribe to properties that do not yet exist.

Te `user.profile.library` subscription gets notified for any of the following set paths:

* `user.profile.library`
* `user`
* `user.profile.library.public`

The `user.profile.library` subscription does not get notified for any of the following set paths:

* `api`
* `user.profile.notifications`

### Subscribers: `state.subscribers(path)` - returns length

Returns number of subscribers on an exact path. Doesn't count longer or shorter paths.

### Transform: `state.transform(key, transformFunction, varargs...)` - returns the new value that was set

The transform function is called with `state.get(key)` followed by the varargs.

Calling transform is equivalent to:

```javascript
state.set(key, transformFunction(state.get(key), ...));
```

This method allows a collection of transform calls to represent allowed ways to update the state. Since these calls
 can be implemented as simple input / output with no side effects, it allows easy testing as well.

## Mixins

An array of mixins can be passed in on initialization. Each mixin will be called with the state instance before the state
instance is returned. 

### Stream Mixin

This mixin allows you to subscribe to appState changes in the form of a stream. A stream is returned that is only written
to when a subscription for the passed in key would run:

### `state.stream(key)` - returns [highland](http://highlandjs.org) stream.

To use `state.stream` you must pass in the mixin. This functionality is separated out as a mixin so that if you do not
use it then you do not pull in highland as a dependency.

```javascript
var AppState = require('app-state'),
    streamMixin = require('app-state/mixin/stream');
    
appState = AppState.init({ mixins : [ streamMixin ] });
    
appState
    .stream('user')
    .filter(function(user) {
        return user.authorized;
    })
    .each(function(user) {
        console.log('user is authorized', user);
    });
```

Note that since appState functions via reference, if you do a toArray on the stream all items will look the same. If 
you template the results in an each, then each update will show the current state. In the case of toArray, each item
in the array is also showing the current state at the time the results of toArray are inspected.

Note:

Highland is a convenient "Reactive Extensions like" library for Node users. Since it is built on top of the built on 
node stream functionality it is quite compact and its behavior depends on a stable core feature of Node.

## Theory

The idea behind having an app state is that it is a unified event channel to communicate
actions through the app. Views can subscribe to the paths that inform them. Models
can trigger sets as they acquire new information. Models can also subscribe to app state
changes to react to changes with business logic.

Having a central communication hub allows the modularization of apps and the adding and
modification of features and business logic easily. The app state doesn't contain any
business logic itself, just the Model layer should have that. 

To keep things simply you cannot run a set while another one is running.

The concept is similar to that of a dispatcher in Flux.

## Future features:

* Ordered subscriptions (before / after other subscription).
* Implement https://github.com/facebook/immutable-js as the data store.
* will use get-setter npm as dependency

## Release notes:

* 1.0.0 - Backward incompatibility - removed stat.calculations, since it can be achieved with transforms or the stream mixin.
