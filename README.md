# Graphical

Simple graph algorithm visualizer. This project provides an opaque undirected graph data structure which exports its data as an adjacency list. Operations on the graph are animated, and you can arbitrarily group nodes and edges. A grouping colors itself different from the rest of the graph.

## API

### graph.nodes()

Returns all the nodes in the graph as an array.

### graph.edges()

Returns all the edges in the graph as an array.

### graph.add(['id'])

Add a set of nodes to the graph.

### graph.remove(['id'])

Remove a set of node from the graph.

### graph.connect([['id', 'id']])

Connect an arbitrary number of two node pairs.

### graph.disconnect([['id', 'id']])
Disconnect an arbitrary number of two node pairs.

### graph.group(['node'] or [['id', 'id']], 'group')

Group an arbitrary set of nodes or edges.

### graph.ungroup(['id'] or [['id', 'id'], 'group')

Remove of a set of nodes or edges from a grouping.

## Example

This is an implementation of depth first search in js. The only added calls that would not exist in a real implementation are the two group calls. Otherwise, all other code is required in any implementation.

    function dfs(graph, id) {
        var i = 0;
        var seen = {};

        function dfs(id, start) {
            if (start.id in seen) return null;

            seen[start.id] = true;
            graph.group(start.id, 'seen');

            if (start.id == id) return start;

            return start.children.reduce(function(result, child) {
                    if (result) return result;

                    graph.group([start.id, child.id], 'seen');
                    i++;

                    return dfs(id, child);
            }, null);
        }

        return dfs(id, graph.nodes[0]);
    }
