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
        groupings = {},
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


    //var node = svg.selectAll(".node"),
        //link = svg.selectAll(".link");

    function update() {
        // Splitting across all groupings.
        var nodeSplit = split(nodes, groups);
        var edgeSplit = split(edges, groups);

        // For each link-grouping combination we update.
        groupings['link'] = dictMap(function(group, link) {
            link = link.data(edgeSplit[group], function(d) { return d.source.id + "-" + d.target.id; });
            link.enter().insert("line", ".node").attr("class", "link" + " " +  group);
            link.exit().remove();
            return link;
        }, groupings['link']);

        // For each node-grouping cominbation we update.
        groupings['node'] = dictMap(function(group, node) {
            node = node.data(nodeSplit[group], function(d) { return d.id; });
            node.enter().append("circle").attr("class", function(d) { return "node " + d.id + " " + group; }).attr("r", 8);
            node.exit().remove();
            return node;
        }, groupings['node']);

        force.start();
    }

    function tick() {
        // For each link-grouping combo set a proper tick.
        dictForEach(function(group, link) {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        }, groupings['link']);

        // For each node-grouping combo set a proper tick.
        dictForEach(function(group, node) {
            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        }, groupings['node']);
    }

    function refresh() {
        // Update the groupings.
        var nodeGroups = dictMap(function(key, value) {
            return svg.selectAll('.node .' + key);
        }, groups);
        var edgeGroups = dictMap(function(key, value) {
            return svg.selectAll('.link .' + key);
        }, groups);

        var keys = dictKeys(groups);

        var notall = keys.map(function(key) { return ':not(.' + key + ')'; }).join(' ');

        nodeGroups[''] = svg.selectAll(".node ");
        edgeGroups[''] = svg.selectAll(".link");

        groupings = {
            'node' : nodeGroups,
            'link' : edgeGroups
        };
    }

    /**
     * Splits a set of objects based on the groups they belong to.
     */
    function split(objects, groups) {
        var result = dictMap(function() { return []; }, groups);
        result[''] = [];

        objects.forEach(function(obj) {
            var data = obj.id ? obj.id : [obj.source.id, obj.target.id];
            var key = hash(data);
            for (group in groups) {
                if (groups.hasOwnProperty(group)) {
                    if (key in groups[group]) {
                        result[group].push(obj);
                        return;
                    }
                }
            }
            result[''].push(obj);
        });

        return result;
    }

    function mutate(action, immediate) {
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

    function indexOfEdge(edge) {
        var source = edge[0],
            target = edge[1];

        for (var i = 0; i < edges.length; i++) {
            var link = edges[i];
            if (link.source.id === source && link.target.id === target) {
                return i;
            }
        }

        return -1;
    }

    function hash(obj) {
        if (obj instanceof Array) {
            return obj.sort().join('-');
        }

        return obj;
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
            var index = indexOfEdge(link);
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

    function group(objects, group) {
        if(!(objects instanceof Array)) objects = [objects];
        else if (objects.length == 0) return;

        // Generate the group entry if it doesn't exit.
        if (!groups[group]) {
            groups[group] = {};
        }

        objects.forEach(function(obj) {
            var index = obj instanceof Array ? indexOfEdge(obj) : indexOfNode(obj);
            if (index < 0) return;

            var key = hash(obj);

            // Remove all other group allegiances.
            for (group in groups) {
                if (groups.hasOwnProperty(group)) {
                    if (key in groups[group]) {
                        delete groups[group][key];
                    }
                }
            }

            // Update this groups' allegiance.
            groups[group][key] = true;
        });

        refresh();
    }

    function ungroup(objects, group) {
        if(!(objects instanceof Array)) objects = [objects];
        else if (objects.length == 0) return;

        objects.forEach(function(obj) {
            var index = obj instanceof Array ? indexOfEdge(obj) : indexOfNode(obj);
            if (index < 0) return;

            var key = hash(obj);

            delete groups[group][key];
        });

        refresh();
    }

    refresh();

    return {
        nodes: function() { return nodes; },
        edges: function() { return edges; },
        add: function(id, immediate) {
            return mutate(add.bind(this, id), immediate);
        },
        remove: function(id, immediate) {
            return mutate(remove.bind(this, id), immediate);
        },
        connect: function(links, immediate) {
            return mutate(connect.bind(this, links), immediate);
        },
        disconnect: function(links, immediate) {
            return mutate(disconnect.bind(this, links), immediate);
        },
        group: function(objects, g, immediate) {
            return mutate(group.bind(this, objects, g), immediate);
        },
        ungroup: function(objects, group, immediate) {
            return mutate(ungroup.bind(this, objects, group), immediate);
        },
    }
}

function dictKeys(dict) {
    var result = [];
    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            result.push(key);
        }
    }
    return result;
}

function dictMap(fn, dict) {
    var result = {};
    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            result[key] = fn(key, dict[key]);
        }
    }
    return result;
}

function dictForEach(fn, dict) {
    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            fn(key, dict[key]);
        }
    }
}

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
