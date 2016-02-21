'use strict';

var appState = require('../index'),
    chai = require('chai'),
    spies = require('chai-spies');

chai.should();
chai.use(spies);

describe('app state', function() {
    describe('init', function() {
        it('should initialize state with empty object', function() {
            var state = appState.init();
            state('').should.deep.equal({});
        });
        it('should set initial state with options.data', function() {
            var state = appState.init({
                data : {
                    user : {
                        first : 'Magnolia',
                        last : 'Mengelson'
                    }
                }
            });

            state('').should.deep.equal({
                user : {
                    first : 'Magnolia',
                    last : 'Mengelson'
                }
            });
        });
        it('should be able to intiialize with a custom Model with an initial state and get / set methods', function() {

            function Model(initial) {
                this.model = initial || {}
            }
            Model.prototype.get = function(path) { return this.model[path]; };
            Model.prototype.set = function(path, value) { this.model[path] = '' + value + value; return this; };

            var state = appState.init({ Model : Model });
            state('double.trouble', 'trouble');
            state('double.trouble').should.equal('troubletrouble');
        });
    });
    describe('set', function() {
        it('can set the root', function() {
            var state = appState.init();
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
            it('will call notified subscribers with the updated value to the subscribed key', function(done) {
                var state = appState.init();

                state.subscribe('user.name.first', function(firstName) {
                    firstName.should.equal('jane');
                    done();
                });

                state('library', true);
                state('user.name', {
                    first : 'jane'
                });
            });
            describe('subscription to multiple keys', function() {
                it('should be able to subscribe to more than one key', function() {
                    var state = appState.init(),
                        spy = chai.spy();

                    state.subscribe('dog', 'cat', spy);

                    state('dog', 'woof');
                    state('cat', 'meow');

                    spy.should.have.been.called.exactly(2);
                    spy.__spy.calls[1].should.deep.equal([ 'woof', 'meow']);
                });
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
});