'use strict';

var chai = require('chai'),
    _h = require('highland'),
    AppState = require('../index'),
    stream = require('../mixins/stream');

chai.should();

describe('stream mixin', function() {
    it('should receive stream of subscription updates only', function(done) {
        var state = AppState.init({
                mixins : [
                    stream
                ]
            }),
            userStream = state.stream('user');

        // Update should be written to stream
        state('user', {
            name : 'pat'
        });

        // Update should not be written to stream
        state('library', 4623);

        // Update should be written to stream
        state('user.authorized', true);

        userStream.write(_h.nil);

        userStream.toArray(function(userData) {
            userData.length.should.equal(2);
            done();
        });
    });
    it('stream is instance of highland stream', function() {
        var state = AppState.init({
                mixins : [
                    stream
                ]
            });
        _h.isStream(state.stream('user')).should.equal(true);
    });
});