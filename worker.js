/**
 * Simple Worker Queue.
 *
 * A simple queue that performs actions out of itself every "interval"
 * amount of time. A context for the Queue is provided at creation time.
 * Every action executed by the queue uses that context as "this",
 */
function WorkerQueue(context, interval) {
    var queue = [];

    /**
     * Add some work to the queue and return a promise
     * that is filled once that work is complete.
     */
    function push(action) {
        var p = new Promise();

        queue.push({
            promise: p,
            action: action
        });

        return p;
    }

    function work() {
        if (queue.length == 0) return;

        var next = queue.shift();
        next.action.apply(context);
        next.promise.resolve(true);
    }

    // Start the queue working.
    setInterval(work, interval || 200);

    return {
        push: push,
    };

    // TODO:Investigate potential bugs since we're not waiting for computation to finish.
    // What if something takes more than 200ms?
}
