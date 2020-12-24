import Graph from "../DataStructure/graph.js";
import Metagraph from '../Meta/metagraph.js';

let GraphVisual = function(values="", canvas=undefined, directed=false, width=500, height=350, startX=0, startY=0) {
    this.aes = {
        width, height,
        startX, startY
    }
    if (canvas == undefined) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.aes.startX = 0;
        this.aes.startY = 0;
    } else {
        this.canvas = canvas;
    }

    let result = parseGraph(values);
    this.graph = result.graph;
    this.highlights = result.highlights;

    this.metagraph = new Metagraph(this.aes.width, this.aes.height, this.aes.startX, this.aes.startY, this.canvas, directed, this.graph);
    this.metagraph.visualizeGraph(this.highlights);

};

let parseGraph = function(values="") {
    let graph = new Graph();
    // General match for expression
    let re = /(?<start>[A-Za-z][0-9A-Za-z]*)\-+(?<weight>[0-9]+)?\-*(?<directed>\>)?(?<end>[A-Za-z][0-9A-Za-z]*)?(?<highlight>\:[0-9A-Za-z\#\(\)\,]+)?/;

    let match, start, end, isDirected, weight, highlight;
    let highlights = {edges:{}, nodes:{}};
    values.split('\n').map(x => {
        // match for each sentence
        match = x.match(re);

        // If not match: did not find a 'start' node, return;
        if (!match) return;

        start = match.groups.start;
        weight = match.groups.weight;
        end = match.groups.end;
        highlight = match.groups.highlight;
        isDirected = match.groups.directed;

        if (isDirected != undefined) graph.directed = true;
        
        if (end == undefined) {
            // start parsing Node;
            if (highlight != undefined) {
                highlights.nodes[`${start}`] = highlight.substr(1);
            }
            graph.insert_node(start);
        } else if (weight == undefined) {
            // parsing unweighted edge
            graph.insert_node(start);
            graph.insert_node(end);
            graph.insert_edge(start, end, 0);
            if (highlight != undefined) {
                if (highlights.edges[`${start}`] == undefined) {
                    highlights.edges[`${start}`] = {};
                }
                highlights.edges[`${start}`][`${end}`] = highlight.substr(1);
            }
        } else {
            graph.insert_node(start);
            graph.insert_node(end);
            graph.insert_edge(start, end, parseInt(weight));
            graph.renderWeight = true;
            if (highlight != undefined) {
                if (highlights.edges[`${start}`] == undefined) {
                    highlights.edges[`${start}`] = {};
                }
                highlights.edges[`${start}`][`${end}`] = highlight.substr(1);
            }
        }
    });

    return {graph, highlights};
}

export default GraphVisual;

/*
let start, weight, end, weightedMatch, unweightedMatch;
        console.log(context);
        context.split("\n").map((x) => {
            if (x == "") return;
            weightedMatch = x.match(/(?<start>[0-9A-Za-z]+)\-+(?<weight>[0-9]+)\-+\>(?<end>[0-9A-Za-z]+)/);
            unweightedMatch = x.match(/(?<start>[0-9A-Za-z]+)\-+\>(?<end>[0-9A-Za-z]+)/);

            if (weightedMatch != null) {
                start = weightedMatch.groups.start;
                weight = parseInt(weightedMatch.groups.weight);
                end = weightedMatch.groups.end;
            } else if (unweightedMatch != null) {
                start = unweightedMatch.groups.start;
                end = unweightedMatch.groups.end;
                weight = 0;
            } else {
                this.environment.dg.commands.push(`${graphName}.insert_node('${x}')`);
                this.environment.dg.graph.insert_node(x);
                return;
            }

            if (!this.environment.dg.graph.check_node(start)) {
                this.environment.dg.commands.push(`${graphName}.insert_node('${start}');`);
                this.environment.dg.graph.insert_node(start);
            }
            if (!this.environment.dg.graph.check_node(end)) {
                this.environment.dg.commands.push(`${graphName}.insert_node('${end}');`);
                this.environment.dg.graph.insert_node(end);
            }
            this.environment.dg.commands.push(`${graphName}.insert_edge('${start}', '${end}', ${weight});`);
            this.environment.dg.graph.insert_edge(start, end, weight);
        })
*/