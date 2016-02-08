'use strict';

var chai = require('chai'),
    AppState = require('../index'),
    stream = require('../mixins/stream');

chai.should();

describe('stream mixin', function() {
    it('should receive stream of subscription updates', function() {
        var state = AppState.init({
            mixins : [
                stream,
            ]
        });

    });
});