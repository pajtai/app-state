'use strict';

var appState = require('../index'),
    chai = require('chai'),
    spies = require('chai-spies');

chai.should();
chai.use(spies);

describe('app state', function() {
    describe('set', function() {
        it('can set the root', function() {
            var state = appState.init({devTools:true});
            state.set('', {a:{b:{c:4}}});
            state.get().should.deep.equal({a:{b:{c:4}}});
        });
        it('can set nested object', function() {

            var state = appState.init();

            state.set('user.pets.dogs', 3);

            state.get().should.deep.equal({
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
                state.set('doing.another.set',0);
            });

            state.set.bind(state, 'user', 0).should.throw(Error);

        });
        it('can set while another set is running if options.allowConcurrent is truthy', function() {
            var state = appState.init({
                allowConcurrent : true
            });


            state.subscribe('user', function() {
                state.set('doing.another.set',0);
            });

            state.set.bind(state, 'user', 0).should.not.throw(Error);

        });

        describe('shortcut set', function() {
            it('can use the shortcut set method', function() {
                var state = appState.init(),
                    returned;
                state('user.pets.dogs', 3);
                returned = state();
                returned.should.deep.equal({
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
                    state('doing.another.set', 0);
                });

                (function() {
                    console.log('START');
                    state('user', 0);
                    console.log('STOP');
                }).should.throw(Error);

            });
        });

    });
    describe('transform', function() {
        it('should be able to change a key', function() {
            var state = appState.init();

            state.transform('user.profile.library', libraryTransform, [ 'Tom Sawyer', 'Monte Cristo' ]);

            state('').should.deep.equal({
                user : {
                    profile : {
                        library : [
                            'Tom Sawyer',
                            'Monte Cristo'
                        ]
                    }
                }
            });

            function libraryTransform(library, books) {
                library = library || [];

                library = library.concat(books);

                return library;
            }
        });
    });
    describe('get', function() {
        it('can get root', function() {
            var state = appState.init();
            state.set('a.b', 3);
            state.set('c', 2);
            state.get().should.deep.equal({
                a : {
                    b : 3
                },
                c : 2
            });

        });
        it('can get existing nested object', function() {
            var state = appState.init();

            state.set('modal.edit.write', { number : 4 });
            state.get('modal.edit.write.number').should.equal(4);
        });
        it('can use shortcut get method', function() {
            var state = appState.init();

            state.set('modal.edit.write', { number : 4 });
            state('modal.edit.write.number').should.equal(4);
        });
    });
    describe('subscribe', function() {
        it('can subscribe to the root', function() {
            var state = appState.init(),
                spy = chai.spy();

            state.subscribe('', spy);

            spy.should.have.been.called.exactly(0);
            state.set('a.b', 2);
            state.set('d.e.f.g', 3);
            spy.should.have.been.called.exactly(2);
        });
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
    describe('unsubscribe', function() {
        it('can unsubscribe from an existing subscription', function() {
            var state = appState.init(),
                spy = chai.spy();

            state.set('duder.galt', 1);

            state.subscribe('duder.galt', spy);

            state.set('duder.galt', 2);

            spy.should.have.been.called.exactly(1);

            state.unsubscribe('duder.galt', spy);

            state.set('duder.galt', 3);

            spy.should.have.been.called.exactly(1);
        });
    });
    describe('calculated properties', function() {
        it('should be able to set calculated properties', function() {
            var state = appState.init();
            state.calculations({
                'user.name.full' : function() {
                    return [
                        state('user.name.first'),
                        state('user.name.last')
                    ].join(' ').trim();
                }
            });

            state('user.name.first', 'Flim');
            state('user.name.last', 'Flam');
            state('user.name.full').should.equal('Flim Flam');
        });

        it('subscribers should be notified after calculations', function() {
            var state = appState.init(),
                spy = chai.spy();

            state.subscribe('user.name.full', function() {
                spy(state('user.name.full'));
            });

            state.calculations({
                'user.name.full': function () {
                    return [
                        state('user.name.first'),
                        state('user.name.last')
                    ].join(' ').trim();
                }
            });

            state('user.name.first', 'Flim');
            state('user.name.last', 'Flam');
            state('user.name.full').should.equal('Flim Flam');

            spy.should.have.been.called.exactly(2);
            spy.__spy.calls[0].should.deep.equal(['Flim']);
            spy.__spy.calls[1].should.deep.equal(['Flim Flam']);
        });
    });
});