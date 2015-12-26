'use strict';

var appState = require('../index'),
    chai = require('chai'),
    spies = require('chai-spies');

chai.should();
chai.use(spies);

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
        });
    });
    describe('subscribe', function() {
        it('subscriber count is initially zero for a path', function() {
            var state = appState.init();

            state.subscribe.subscribers('a.b.c').should.equal(0);
        });
        it('subscriber count returns number of subscribers for exact path', function() {
            var state = appState.init();

            state.subscribe('a.b', function() {});
            state.subscribe('a.b', function() {});
            state.subscribe('a.b', function() {});

            state.subscribe.subscribers('a.b').should.equal(3);
        });
        describe('subscription notification', function() {
            it('will notify subscribers on exact path that is set', function() {
                var state = appState.init(),
                    spy = chai.spy();

                state.subscribe('a.b', spy);

                spy.should.have.been.called.exactly(0);
                state.set('a.b', 2);
                spy.should.have.been.called.exactly(1);
            });
            it('will notify subscribers on path that is included in set path', function() {
                var state = appState.init(),
                    spy = chai.spy();

                state.subscribe('user', spy);
                spy.should.have.been.called.exactly(0);
                state.set('user.identity.name', 'Clara');
                spy.should.have.been.called.exactly(1);

            });
            it('will notify subscribers on path that is an extension of set path', function() {
                var state = appState.init(),
                    spy = chai.spy();

                state.subscribe('user.identity.authorized', spy);
                spy.should.have.been.called.exactly(0);
                state.set('user.identity', null);
                spy.should.have.been.called.exactly(1);
            });
            // TODO: check things like 'userName.first' does not notify 'user'
        });
    });
});