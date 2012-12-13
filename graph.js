function Graph() {
    var width = 960,
        height = 500;

    var color = d3.scale.category20();

    this.nodes = [];
    this.links = [];

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

    var node = svg.selectAll(".node"),
        link = svg.selectAll(".link");

    this.update = function() {
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

    this.update();
}

Graph.prototype.addNode = function(id) {
    this.nodes.push({id: id});
    this.update();
}

Graph.prototype.removeNode = function(id) {
    var index = this.indexOfNode(id);

    if (index < 0) return;

    // Remove nodes and related links.
    this.nodes.splice(index, 1);
    this.indicesOfLinks(id).forEach(function(index) {
        this.links.splice(index, 1);
    }.bind(this));

    this.update();
}

Graph.prototype.addLink = function(a, b) {
    a = this.findNode(a);
    b = this.findNode(b);
    if (!a || !b) return;

    this.links.push({source:a, target:b});
    this.update();
}

Graph.prototype.removeLink = function(a, b) {
    var index = this.indexOfLink(a,b);

    if (index < 0) return;

    this.links.splice(index, 1);
    
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
    
//  this.removeNode = function (id) {
//      var i = 0;
//      var n = findNode(id);
//      while (i < links.length) {
//          if ((links[i]['source'] == n)||(links[i]['target'] == n)) links.splice(i,1);
//          else i++;
//      }
//      nodes.splice(findNodeIndex(id),1);
//      update();
//  }

//  this.addLink = function (source, target) {
//      links.push({"source":findNode(source),"target":findNode(target)});
//      update();
//  }
graph = new Graph();

// You can do this from the console as much as you like...
//graph.addNode("Cause");
//graph.addNode("Effect");
//graph.addLink("Cause", "Effect");
//graph.addNode("A");
//graph.addNode("B");
//graph.addLink("A", "B");
