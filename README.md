# app-state
v0.2.0-beta.1

[![Build Status](https://travis-ci.org/pajtai/app-state.svg?branch=master)](https://travis-ci.org/pajtai/app-state)

A place to store the object that represents your app state. You can create subscriptions, set, and get paths.

[Chrome extension](https://github.com/Duder-onomy/app-state-chrome-extension)

![appstate-live-update](https://cloud.githubusercontent.com/assets/1643937/12075681/b1d5caba-b13c-11e5-8c8e-54eb239bcb93.gif)

## Usage

Create a new app state object:

```javascript
var state = require('app-state').init();
```

## Methods

### Init: `require('app-state').init()` - returns state

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

The `user.profile.library` subscription gets notified for any of the following set paths:

* `user.profile.library`
* `user`
* `user.profile.library.public`

The `user.profile.library` subscription does not get notified for any of the following set paths:

* `api`
* `user.profile.notifications`

### Subscribers: `state.subscribers(path)` - returns length

Returns number of subscribers on an exact path. Doesn't count longer or shorter paths.

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
