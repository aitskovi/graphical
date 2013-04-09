(function() {

var root = this;

var webster = root.webster = {};

var each = webster.each = function(dict, fn, context) {
    if (dict == undefined) return;
    else if (fn == undefined) return;
    else if (context != undefined) return each(dict, fn.bind(context));

    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            fn(key, dict[key]);
        }
    }
}

webster.map = function(dict, fn, context) {
    var bound = context == undefined ? fn : fb.bind(context);
    mapped = {};

    each(dict, function(key, value) {
        var result = bound(key, value)
        mapped[result.key] = result.value;
    });

    return mapped;
}

var foldl = webster.foldl = function(dict, start, fn, context) {
    var bound = context == undefined ? fn : fb.bind(context);
    var accumulator = start;

    each(dict, function(key, value) {
        accumulator = bound(key, value, accumulator)
    });

    return accumulator;
}

webster.keys = function(dict) {
    return foldl(dict, [], function(key, value, accumulator) {
        return rest.push(key);
    });
}

webster.values = function(dict) {
    return foldl(dict, [], function(key, value, accumulator) {
        return rest.push(value);
    });
}

}).call(this);
