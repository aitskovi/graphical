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

/**
 * Graph wrapper based off of http://bl.ocks.org/1095795
 */
function Graph() {
    var width = 960,
        height = 500;

    var color = d3.scale.category20();

    var nodes = [],
        edges = [],
        groups = {},
        queue = new WorkerQueue(this, 250);

    var force = d3.layout.force()
        .nodes(nodes)
        .links(edges)
        .charge(-120)
        .linkDistance(30)
        .size([width, height])
        .on("tick", tick);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var node = svg.selectAll(".node"),
        link = svg.selectAll(".link");

    function update() {
        link = link.data(force.links(), function(d) {return d.source.id + "-" + d.target.id; });
        link.enter().insert("line", ".node").attr("class", "link");
        link.exit().remove();

        node = node.data(force.nodes(), function(d) { return d.id; });
        node.enter().append("circle").attr("class", function(d) { return "node " + d.id; }).attr("r", 8);
        node.exit().remove();

        force.start();
    }
      
    function tick() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
    }

    function mutate (action, immediate) {
        var updated = function() {
            var result = action.apply(this);
            force.nodes(nodes).links(edges);
            update();
            return result;
        };

        if (immediate) {
            return Promise.value(updated.apply(this));
        } else {
            return queue.push(updated);
        }
    }

     function indexOfNode(id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                return i;
            }
        }

        return -1;
     }

     function indexOfEdge(source, target) {
         for (var i = 0; i < links.length; i++) {
             var link = links[i];
             if (link.source.id === source && link.target.id === target) {
                 return i;
             }
         }

         return -1;
     }

    function add(ids) {
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        nodes = nodes.concat(ids.map(function(id) {
            return {
                id: id,
                children: []
            };
        }));
    }

    function remove(id) {
        var index = indexOfNode(id);

        if (index < 0) return;

        // Remove nodes and related links.
        var node = nodes[index];

        while(node.children.length != 0) {
            var child = node.children[0];
            disconnect([node.id, child.id], true);
            disconnect([child.id, node.id], true);
        }

        nodes.splice(index, 1);
    }

    function connect(links) {
        if (links.length == 0) return;
        if (!(links[0] instanceof Array)) links = [links];

        links.forEach(function(link) {
            a = indexOfNode(link[0]);
            b = indexOfNode(link[1]);
            if (a < 0 || b < 0) return;

            a = nodes[a];
            b = nodes[b];

            a.children.push(b);
            b.children.push(a);

            edges.push({source:a, target:b});
        });
    }

    function disconnect(links) {
        if (links.length == 0) return;
        if (!(links[0] instanceof Array)) links = [links];

        links.forEach(function(link) {
            var index = indexOfEdge(link[0],link[1]);
            var a = indexOfNode(link[0]);
            var b = indexOfNode(link[1]);

            if (index < 0 || a < 0 || b < 0) return;

            // Get the actual nodes
            a = nodes[a];
            b = nodes[b];

            // Remove from child lists.
            a.children.splice(a.children.indexOf(b), 1);
            b.children.splice(b.children.indexOf(a), 1);

            // Remove from edge list.
            edges.splice(index, 1);
        });
    }

    return {
        nodes: function() { return nodes; },
        edges: function() { return edges; },
        add: function(id, immediate) {
            mutate(add.bind(this, id), immediate);
        },
        remove: function(id, immediate) {
            mutate(remove.bind(this, id), immediate);
        },
        connect: function(links, immediate) {
            mutate(connect.bind(this, links), immediate);
        },
        disconnect: function(links, immediate) {
            mutate(disconnect.bind(this, links), immediate);
        },
        group: null,
        ungroup: null,
    }
}

/*
Graph.prototype.matchingHash = function(link) {
    return link.source.id + "-" + link.target.id;
}

Graph.prototype.addMatchingEdge = function(link, immediate) {
    var add = function() {
        if (this.indexOfLink(link[0], link[1]) < 0) return;

        link = this.links[this.indexOfLink(link[0], link[1])];
        this.matching[this.matchingHash(link)] = true;

        this.update();
    };

    return this.mutate(add, immediate);
}

Graph.prototype.removeMatchingEdge = function(link, immediate) {
    var remove = function() {
        var index = this.indexOfLink(link[0], link[1]);
        if (index < 0) return;

        link = this.links[index];
        delete this.matching[link.source.id + "-" + link.target.id];

        this.update();
    };

    return this.mutate(remove, immediate);
}

Graph.prototype.coverHash = function(node) {
    return node.id;
}

Graph.prototype.addCoverNode = function(id, immediate) {
    var add = function() {
        var index = this.indexOfNode(id);

        if (index < 0) return;

        var node = this.nodes[index];
        this.cover[this.coverHash(node)] = true;

        this.update();
    };

    return this.mutate(add, immediate);
}

Graph.prototype.removeCoverNode = function(id, immediate) {
    var remove = function() {
        var index = this.indexOfNode(id);

        if (index < 0) return;

        var node = this.nodes[index];
        delete this.cover[this.coverHash(node)];

        this.update();
    };

    return this.mutate(remove, immediate);
}
*/

/**
 * Run a depth first search for the id.
 */
function dfs(id, graph) {
    var i = 0;
    var seen = {};

    function dfs(id, start) {
        if (start.id in seen) return null;

        seen[start.id] = true;
        graph.addCoverNode(start.id);

        if (start.id == id) return start;

        return start.children.reduce(function(result, child) {
            if (result) return result;

            graph.addMatchingEdge([start.id, child.id]);
            i++;

            return dfs(id, child);
        }, null);
    }

    return dfs(id, graph.nodes[0]);
}

graph = new Graph();

graph.add("A");
graph.add(["B", "C", "D", "E", "F"]);
graph.connect(["A", "B"]);
graph.connect([["A", "C"], ["A", "D"], ["D", "E"], ["C", "F"]]);
