/**
 * Graph wrapper based off of http://bl.ocks.org/1095795
 */

function Graph() {
    var width = 960,
        height = 500;

    var color = d3.scale.category20();

    this.nodes = [];
    this.links = [];
    this.matching = {};
    this.cover = {};

    var force = d3.layout.force()
        .nodes(this.nodes)
        .links(this.links)
        .charge(-120)
        .linkDistance(30)
        .size([width, height])
        .on("tick", tick);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var node = svg.selectAll(".node :not(.cover)"),
        cover = svg.selectAll(".node .cover"),
        link = svg.selectAll(".link :not(.matching)"),
        match = svg.selectAll(".link .matching");

    this.update = function() {

        var edges = force.links().filter(function(edge) {
            return !(this.matchingHash(edge) in this.matching);
        }.bind(this));

        var matchingEdges = force.links().filter(function(edge) {
            return this.matchingHash(edge) in this.matching;
        }.bind(this));

        var nodes = force.nodes().filter(function(node) {
            return !(this.coverHash(node) in this.cover);
        }.bind(this));

        var coverNodes = force.nodes().filter(function(node) {
            return this.coverHash(node) in this.cover;
        }.bind(this));

        link = link.data(edges, function(d) {return d.source.id + "-" + d.target.id; });
        link.enter().insert("line", ".node").attr("class", "link");
        link.exit().remove();

        match = match.data(matchingEdges, function(d) {return d.source.id + "-" + d.target.id; });
        match.enter().insert("line", ".node").attr("class", "link matching");
        match.exit().remove();
        
        node = node.data(nodes, function(d) { return d.id; });
        node.enter().append("circle").attr("class", function(d) { return "node " + d.id; }).attr("r", 8);
        node.exit().remove();

        cover = cover.data(coverNodes, function(d) { return d.id; });
        cover.enter().append("circle").attr("class", function(d) { return "node cover " + d.id; }).attr("r", 8);
        cover.exit().remove();

        force.start();
    }
      
    function tick() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            match.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            cover.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

    }

    this.update();
}

Graph.prototype.findNode = function(id) {
    return this.nodes.filter(function(node) {
        return node.id == id;
    })[0];
}

Graph.prototype.indexOfNode = function(id) {
    for (var i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].id === id) {
            return i;
        }
    }

    return -1;
}

Graph.prototype.indexOfLink = function(source, target) {
    for (var i = 0; i < this.links.length; i++) {
        var link = this.links[i];
        if (link.source.id === source || link.target.id === target) {
            return i;
        }
    }

    return -1;
}

Graph.prototype.indicesOfLinks = function(id) {
    var indices = [];
    for (var i = 0; i < this.links.length; i++) {
        var link = this.links[i];
        if (link.source.id === id || link.target.id === id) {
            indices.push(i);
        }
    }

    return indices;
}

Graph.prototype.addNode = function(id) {
    this.nodes.push({id: id});
    this.update();
}

Graph.prototype.removeNode = function(id) {
    var index = this.indexOfNode(id);

    if (index < 0) return;

    // Remove nodes and related links.
    var node = this.nodes[index];
    this.removeCoverNode(node.id);
    this.nodes.splice(index, 1);

    this.indicesOfLinks(id).forEach(function(index) {
        var link = this.links[index];
        this.removeLink([link.source.id, link.target.id]);
    }.bind(this));

    this.update();
}

Graph.prototype.addLink = function(link) {
    a = this.findNode(link[0]);
    b = this.findNode(link[1]);
    if (!a || !b) return;

    this.links.push({source:a, target:b});
    this.update();
}

Graph.prototype.removeLink = function(link) {
    var index = this.indexOfLink(link[0],link[1]);

    if (index < 0) return;

    delete this.matching[this.matchingHash(this.links[index])];
    this.links.splice(index, 1);
    this.update();
}

Graph.prototype.matchingHash = function(link) {
    return link.source.id + "-" + link.target.id;
}

Graph.prototype.addMatchingEdge = function(link) {
    if (this.indexOfLink(link[0], link[1]) < 0) return;

    link = this.links[this.indexOfLink(link[0], link[1])];
    this.matching[this.matchingHash(link)] = true;

    this.update();
}

Graph.prototype.removeMatchingEdge = function(link) {
    var index = this.indexOfLink(link[0], link[1]);
    if (index < 0) return;

    link = this.links[index];
    delete this.matching[link.source.id + "-" + link.target.id];

    this.update();
}

Graph.prototype.coverHash = function(node) {
    return node.id;
}

Graph.prototype.addCoverNode = function(node) {
    var index = this.indexOfNode(node);

    if (index < 0) return;

    var node = this.nodes[index];
    this.cover[this.coverHash(node)] = true;

    this.update();
}

Graph.prototype.removeCoverNode = function(node) {
    var index = this.indexOfNode(node);

    if (index < 0) return;

    var node = this.nodes[index];
    delete this.cover[this.coverHash(node)];

    this.update();
}

graph = new Graph();

graph.addNode("A");
graph.addNode("B");
graph.addNode("C");
graph.addNode("D");
graph.addNode("E");
graph.addNode("F");
graph.addLink(["A", "B"]);
graph.addLink(["A", "C"]);
graph.addLink(["A", "D"]);
graph.addLink(["D", "E"]);
graph.addLink(["C", "F"]);
graph.addMatchingEdge(["A", "B"]);
graph.addMatchingEdge(["D", "E"]);
graph.addMatchingEdge(["C", "F"]);
graph.addCoverNode("A");
