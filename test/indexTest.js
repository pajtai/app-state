'use strict';

var appState = require('../index');

require('chai').should();

describe('app state', function() {
    describe('set', function() {
        it('can set nested object', function() {

            appState.init().set('data.a.b', 3).should.deep.equal({
                data : {
                    a : {
                        b : 3
                    }
                }
            });
        });
    });
    describe('get', function() {
        it('can get existing nested object', function() {
            var state = appState.init();

            state.set('data.a.b', { c : 4 });
            state.get('data.a.b.c').should.equal(4);
        })
    });
});