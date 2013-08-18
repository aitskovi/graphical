# Graphical Namesapce
graphical = {}

# Export namesapce to window.
this.graphical = graphical;

class Graph
    # Nodes/Vertices in our graph.
    nodes = []

    # Edges/Links in our graph.
    links = []

    force = null
    svg = null
    node = null
    link = null

    constructor: (vertices, edges) ->
        @add(vertices)
        @connect(edges)

        init()
        render()

    vertices: ->
        node.id for node in nodes

    edges: ->
        return @links

    contains: (id) ->
        (node for node in nodes when node.id is id).length > 0

    add: (ids) ->
        for id in ids
            if !@contains(id)
                nodes = nodes.concat([{id: id}])

    remove: (ids) ->

    connect: (edges) ->

    disconnect: (edges) ->

    render = ->
        link = link.data(force.links(), (d) -> d.source.id + "-" + d.target.id)
        link.enter().insert("line", ".node").attr("class", "link")
        link.exit().remove()

        node = node.data(force.nodes(), (d) -> d.id)
        node.enter().append("circle").attr("class", (d) -> "node " + d.id).attr("r", 8);
        node.exit().remove()

        force.start()

    tick = ->
        # Tick function for d3.js
        node.attr("cx", (d) -> d.x)
             .attr("cy", (d) -> d.y)

        link.attr("x1", (d) -> d.source.x)
             .attr("y1", (d) -> d.source.y)
             .attr("x2", (d) -> d.target.x)
             .attr("y0", (d) -> d.target.y)

    init =  ->
        width = 960
        height = 500
        force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .charge(-400)
            .linkDistance(120)
            .size([width, height])
            .on("tick", tick)

        svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)

        node = svg.selectAll(".node")
        link = svg.selectAll(".link")

# Export a way to construct the graph.
graphical.graph = (nodes = [], edges = []) -> new Graph(nodes, edges)

graphical.graph(['a'], null)
