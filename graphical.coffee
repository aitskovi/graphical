# Graphical Namesapce
graphical = {}

# Export namesapce to window.
this.graphical = graphical;

class Graph
    constructor: (nodes, edges) ->
        @nodes = []
        @edges = []

        @add(nodes)
        @connect(edges)

        @init()
        @render()

    nodes: ->
        return @nodes

    edges: ->
        return @edges

    add: (ids) ->
        @nodes = @nodes.concat({id: id} for id in ids)

    remove: (ids) ->

    connect: (edges) ->

    disconnect: (edges) ->

    render: ->
        @link = @link.data(@force.links(), (d) -> d.source.id + "-" + d.target.id)
        @link.enter().insert("line", ".node").attr("class", "link")
        @link.exit().remove()

        console.log("Node 2" )
        console.log(@node)
        @node = @node.data(@force.nodes(), (d) -> d.id)
        @node.enter().append("circle").attr("class", (d) -> "node " + d.id).attr("r", 8);
        @node.exit().remove()
        console.log("Node 3")
        console.log(@node)

        @force.start()

    tick: =>
        # Tick function for d3.js
        @node.attr("cx", (d) -> d.x)
             .attr("cy", (d) -> d.y)

        @link.attr("x1", (d) -> d.source.x)
             .attr("y1", (d) -> d.source.y)
             .attr("x2", (d) -> d.target.x)
             .attr("y0", (d) -> d.target.y)

    init:  ->
        width = 960
        height = 500
        @force = d3.layout.force()
            .nodes(@nodes)
            .links(@edges)
            .charge(-400)
            .linkDistance(120)
            .size([width, height])
            .on("tick", @tick)

        @svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)

        @node = @svg.selectAll(".node")
        console.log("Node 1");
        console.log(@node)
        @link = @svg.selectAll(".link")

# Export a way to construct the graph.
graphical.graph = (nodes = [], edges = []) -> new Graph(nodes, edges)

graphical.graph(['a'], null)
