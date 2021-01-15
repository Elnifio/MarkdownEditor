import Graph from "../DataStructure/graph.js";
import Metagraph from '../Meta/metagraph.js';

let updateRE = /(?<command>add|delete)\s+(?<start>[A-Za-z][0-9A-Za-z]*)\-+(?<weight>[0-9]+\-+)?(?<directed>\>)?(?<end>[A-Za-z][0-9A-Za-z]*)?(?<highlight>\:[0-9A-Za-z\#\(\)\,\.\s]+)?/;
let deleteChars = /\-/g;

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

    this.metagraph.updateGraph(this.highlights);

    this.updateGraph = function(updateValues="") {
        let highlights = {edges:{}, nodes:{}};
        let match, start, end, isDirected, weight, highlight, command;
        updateValues.split('\n').map(x => {
            match = x.match(updateRE);

            // did not match, so do not modify
            if (!match) return;

            // parsed result
            start = match.groups.start;
            weight = match.groups.weight == undefined?undefined:match.groups.weight.replace(deleteChars, '');
            end = match.groups.end;
            highlight = match.groups.highlight;
            isDirected = match.groups.directed;
            command = match.groups.command;

            // If isDirected: update isDirected
            if (isDirected != undefined) this.graph.isDirected = true;

            // If command is 'add':
            if (command == "add") {
                if (end == undefined) {
                    // start parsing Node;
                    if (highlight != undefined) {
                        highlights.nodes[`${start}`] = highlight.substr(1);
                    }
                    this.graph.insert_node(start);
                } else if (weight == undefined) {
                    // parsing unweighted edge
                    this.graph.insert_node(start);
                    this.graph.insert_node(end);
                    this.graph.insert_edge(start, end, 0);
                    if (highlight != undefined) {
                        if (highlights.edges[`${start}`] == undefined) {
                            highlights.edges[`${start}`] = {};
                        }
                        highlights.edges[`${start}`][`${end}`] = highlight.substr(1);
                    }
                } else {
                    this.graph.insert_node(start);
                    this.graph.insert_node(end);
                    this.graph.insert_edge(start, end, parseInt(weight));
                    this.graph.renderWeight = true;
                    if (highlight != undefined) {
                        if (highlights.edges[`${start}`] == undefined) {
                            highlights.edges[`${start}`] = {};
                        }
                        highlights.edges[`${start}`][`${end}`] = highlight.substr(1);
                    }
                }
            } 
            
            else if (command == "delete") {
                if (end == undefined) {
                    // start parsing Node;
                    this.graph.delete_node(start);
                } else if (weight == undefined) {
                    // parsing unweighted edge
                    this.graph.delete_edge(start, end);
                } else {
                    this.graph.delete_edge(start, end);
                    this.graph.renderWeight = true;
                }
            } 

            // should not occur
            else {
                return;
            }
        });
        this.metagraph.updateGraph(highlights);
    }
};

let re = /(?<start>[A-Za-z][0-9A-Za-z]*)\-+(?<weight>[0-9]+\-+)?(?<directed>\>)?(?<end>[A-Za-z][0-9A-Za-z]*)?(?<highlight>\:[0-9A-Za-z\#\(\)\,\.\s]+)?/;

let parseGraph = function(values="") {
    let graph = new Graph();
    // General match for expression
    let match, start, end, isDirected, weight, highlight;
    let highlights = {edges:{}, nodes:{}};
    values.split('\n').map(x => {
        // match for each sentence
        match = x.match(re);

        // If not match: did not find a 'start' node, return;
        if (!match) return;

        start = match.groups.start;
        weight = match.groups.weight == undefined?undefined:match.groups.weight.replace(deleteChars, '');
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
