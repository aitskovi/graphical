# Graphical Namesapce
graphical = {}

# Export namesapce to window.
this.graphical = graphical;

class Graph
    constructor: (nodes, edges) ->
        # TODO Filter out invalid nodes/edges.
        @nodes = nodes
        @edges = edges

    nodes: ->
        return @nodes

    edges: ->
        return @edges

    add: (ids) ->

    remove: (ids) ->

    connect: (edges) ->

    disconnect: (edges) ->

    render: ->
        console.log("Not Implemented")

# Export a way to construct the graph.
graphical.graph = (nodes = [], edges = []) -> new Graph(nodes, edges)
