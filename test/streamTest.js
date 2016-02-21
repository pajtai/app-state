'use strict';

var appStateStream = require('../stream'),
    H = require('highland'),
    chai = require('chai'),
    spies = require('chai-spies');

chai.should();
chai.use(spies);


describe('app-state-stream', function() {
    describe('stream', function() {
        it('should receive last set value', function(done) {
            var state = appStateStream.init(),
                userStream;

            // Update should be written to stream
            state('user', {
                name : 'pat'
            });

            userStream = state.stream('user');
            userStream.toArray(function(userData) {
                userData.should.deep.equal([
                    [{ name : 'pat' }]
                ]);
                done();
            });
            userStream.write(H.nil);
        });
        it('should be able to subscribe to multiple keys', function(done) {

            var state = appStateStream.init(),
                stream = state.stream('user.name', 'library'),
                spy = chai.spy();


            state('user.name', 'bob');
            state('library', [1,2]);

            stream.write(H.nil);

            stream.toArray(function(data) {
                data.should.deep.equal([
                    [ undefined, undefined ],
                    [ 'bob', undefined ],
                    [ 'bob', [ 1, 2 ] ]
                ]);
                done();
            });
        });
        it('should receive stream of subscription updates only', function(done) {
            var state = appStateStream.init(),
                userStream = state.stream('user');

            // Update should be written to stream
            state('user', {
                name : 'pat'
            });

            // Update should not be written to stream
            state('library', 4623);

            // Update should be written to stream
            state('user.authorized', true);

            userStream.write(H.nil);

            userStream.toArray(function(userData) {
                userData.should.deep.equal([
                    [undefined],
                    [{ name : 'pat' }],
                    [{ name : 'pat', authorized : true }]
                ]);
                done();
            });
        });
        it('stream is instance of highland stream', function() {
            var state = appStateStream.init();
            H.isStream(state.stream('user')).should.equal(true);
        });
    });
});