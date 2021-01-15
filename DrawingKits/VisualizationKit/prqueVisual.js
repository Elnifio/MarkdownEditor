import Metaarray from "../Meta/metaarray.js";
import Metatree from "../Meta/metatree.js";
import Tree from "../DataStructure/tree.js";

let re = /(?<value>[0-9A-Za-z]*)(?<highlight>\:[0-9A-Za-z\#\(\)\,\.\s]+)?/

let PrqueVisual = function(inputs="", canvas=undefined, width=500, heightTree=350, heightArray=150) {
    if (canvas == undefined) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = heightTree+heightArray;
    } else {
        this.canvas = canvas;
    }

    let values = [];
    let highlights = {};
    let rematch, value, highlight;

    inputs.replace(/[\n|\s]/g, '').split(',').map(x => {
        rematch = x.match(re);
        if (!rematch) return;

        value = rematch.groups.value;
        highlight = rematch.groups.highlight;

        values.push(value);
        if (highlight) {
            highlights[`${values.length-1}`] = highlight.substr(1);
        }
    })
    

    let tree = new Tree();
    
    if (values.length > 0) {
        tree.root.value = values[0];
        let leafnodes = [];
        let current;
        let out;
        current = tree.root;
        for (let i = 1; i < values.length; i++) {
            if (current.find_children().length >= 2) {
                current = leafnodes.splice(0, 1)[0];
            }
            out = current.add_element(values[i]);
            leafnodes.push(out);
        }
        this.tree = new Metatree(width, heightTree, 0, 0, this.canvas, tree);
        this.array = new Metaarray(width, heightArray, 0, heightTree, this.canvas, values);

        this.tree.visualizeTree(highlights);
        this.array.visualizeArray(highlights);
    }
}

export default PrqueVisual;