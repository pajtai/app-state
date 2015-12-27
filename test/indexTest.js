'use strict';

var appState = require('../index'),
    chai = require('chai'),
    spies = require('chai-spies');

chai.should();
chai.use(spies);

describe('app state', function() {
    describe('set', function() {
        it('can set nested object', function() {

            appState.init().set('user.pets.dogs', 3).data.should.deep.equal({
                user : {
                    pets : {
                        dogs : 3
                    }
                }
            });
        });
        it('cannot set while another set is running', function() {
            var state = appState.init();


            state.subscribe('user', function() {
                state.set('doing.another.set');
            });

            state.set.bind(state, 'user').should.throw(Error);

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

            state.subscribers('a.b.c').should.equal(0);
        });
        it('subscriber count returns number of subscribers for exact path', function() {
            var state = appState.init();

            state.subscribe('reports.daily', function() {});
            state.subscribe('reports.daily', function() {});
            state.subscribe('reports.daily', function() {});

            state.subscribers('reports.daily').should.equal(3);
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
            it('will not notify subscribers on path whose key does not fully match', function() {
                var state = appState.init(),
                    spy = chai.spy();

                state.subscribe('user', spy);
                spy.should.have.been.called.exactly(0);
                state.set('username', 'buddy boy');
                spy.should.have.been.called.exactly(0);
            });
            it('will not notify subscribers if not on the path', function() {
                var state = appState.init(),
                    spy = chai.spy();

                state.subscribe('user.firstname', spy);
                spy.should.have.been.called.exactly(0);

                state.set('user.lastname', 'samson');
                spy.should.have.been.called.exactly(0);

                state.set('api.version', 42);
                spy.should.have.been.called.exactly(0);
            });
        });
        describe('subscription order', function() {
            it('will notify subscribers in order subscribed', function() {
                var state = appState.init(),
                    spy = chai.spy();

                state.subscribe('user.name', function() {
                    spy(1);
                });
                state.subscribe('user', function() {
                    spy(2);
                });
                state.subscribe('user.name.last', function() {
                    spy(3);
                });

                state.set('user', 'ok');

                spy.should.have.been.called.exactly(3);
                spy.__spy.calls[0].should.deep.equal([1]);
                spy.__spy.calls[1].should.deep.equal([2]);
                spy.__spy.calls[2].should.deep.equal([3]);
            });
        });
    });
});