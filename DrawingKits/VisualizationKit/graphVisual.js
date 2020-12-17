import Graph from "../DataStructure/graph.js";
import Metagraph from '../Meta/metagraph.js';

let GraphVisual = function(values="", directed=false, width=500, height=350) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;


};

let parseGraph = function(values="", directed=false) {
    let graph = (directed)?new Graph.DirectedGraph():new Graph.UndirectedGraph();
    values.split('\n').map(x => {
        
    })
    
}

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