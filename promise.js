/**
 * Simple Promise Implementation.
 *
 * Promise implementation with only chaining and no errors.
 */
var Promise = function() {
    var pending = [], result;

    function then(callback) {
        var p = new Promise();
        var action = function() {
            var temp = callback(result);
            p.resolve(temp);
        }

        if (!pending) {
            action();
        } else {
            pending.push(action);
        }

        return p;
    }

    function resolve(value) {
        result = value;

        pending.forEach(function(action) {
                action();
        });

        return this;
    }

    return {
        then: then,
        resolve: resolve
    }
}

Promise.value = function(value) {
    var p = new Promise();
    return p.resolve(value);
}
