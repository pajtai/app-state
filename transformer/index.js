'use strict';

Transformer.prototype.with = transformWith;
Transformer.prototype.using = using;
Transformer.prototype.complete = complete;
Transformer.prototype.transform = transform;

module.exports = Transformer;

function Transformer(key, state) {
    this.state = state;
    this.key = key;
}

function transformWith(transformer) {
    this.transformer = transformer;
    if (this.complete()) {
        this.transform();
    }
    return this;
}

function using() {
    this.varargs = [].slice.call(arguments);
    this.varargs.unshift(this.state.get(this.key));
    if (this.complete()) {
        this.transform();
    }
    return this;
}

function transform() {
    var result = this.transformer.apply(null, this.varargs);
    this.state.set(this.key, result);
}

function complete() {
    return !!this.transformer && !!this.varargs;
}