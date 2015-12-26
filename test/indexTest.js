'use strict';

var appState = require('../index'),
    chai = require('chai'),
    spies = require('chai-spies');

chai.should();
chai.use(spies);

describe('app state', function() {
    describe('set', function() {
        it('can set nested object', function() {

            appState.init().set('user.pets.dogs', 3).should.deep.equal({
                user : {
                    pets : {
                        dogs : 3
                    }
                }
            });
        });
    });
    describe('get', function() {
        it('can get existing nested object', function() {
            var state = appState.init();

            state.set('modal.edit.write', { number : 4 });
            state.get('modal.edit.write.number').should.equal(4);
        });
    });
    describe('subscribe', function() {
        it('subscriber count is initially zero for a path', function() {
            var state = appState.init();

            state.subscribe.subscribers('a.b.c').should.equal(0);
        });
        it('subscriber count returns number of subscribers for exact path', function() {
            var state = appState.init();

            state.subscribe('reports.daily', function() {});
            state.subscribe('reports.daily', function() {});
            state.subscribe('reports.daily', function() {});

            state.subscribe.subscribers('reports.daily').should.equal(3);
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