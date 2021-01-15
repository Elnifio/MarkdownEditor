import config from "./config.js";
import Tree from '../DataStructure/tree.js';

let Metatree = function(width, height, canvasX=0, canvasY=0, canvas=undefined, tree=undefined, configMeta=config) {
    // setup for canvas
    this.properties = {width, height, canvasX, canvasY};

    if (canvas == undefined) {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "testCanvas";
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.border = configMeta.canvasBorderStyle;
        this.properties.canvasX = 0;
        this.properties.canvasY = 0;
    } else {
        this.canvas = canvas;
    }

    // setup for tree
    if (tree == undefined) {
        this.tree = new Tree("root");
    } else {
        this.tree = tree;
    }

    this.getFontLength = function(label, configFontLength=configMeta) {
        return configFontLength.labelFontSize * label.length;
    }

    this.drawRectangle = function(x, y, label="", highlight=false, configRectangular=configMeta) {
        let cursor = this.canvas.getContext('2d');

        let widthRect = configRectangular.circleRadius * 2;
        let heightRect = widthRect;
        let textLength = this.getFontLength(label);

        widthRect = widthRect < textLength?textLength:widthRect;

        cursor.strokeStyle = configRectangular.circleBorder;
        cursor.strokeRect(x-widthRect/2, y-heightRect/2, widthRect, heightRect);

        cursor.fillStyle = configRectangular.circleFill;
        cursor.fillRect(x-widthRect/2, y-heightRect/2, widthRect, heightRect);

        if (highlight) {
            cursor.strokeRect(x-widthRect/2+1, y-heightRect/2+1, widthRect-2, heightRect-2);
        }

        cursor.textAlign = "center";
        cursor.font = `${configRectangular.labelFontSize}px ${configRectangular.labelFontType}`;
        cursor.strokeText(label, x, y);
    }

    this.drawLine = function(x1, y1, x2, y2, configLine = configMeta) {
        let cursor = this.canvas.getContext("2d");
        cursor.beginPath();
        cursor.moveTo(x1, y1);
        cursor.strokeStyle = configLine.lineColor;
        cursor.lineTo(x2, y2);
        cursor.stroke();
    }

    this.arrangePositions = function() {
        let queue = [];
        this.tree.resetCursor();

        let element, currentNode, children, splittedWidth;
        element = {
            node: this.tree.current, 
            position: {x: this.properties.canvasX + this.properties.width/2, y: this.properties.canvasY + configMeta.canvasBorder + configMeta.circleRadius},
            connectTo: [],
            availableWidth: this.properties.width,
            startX: this.properties.canvasX
        }
        queue.push(element);

        let positions = [];
        let index = 0;
        
        while (queue.length > 0) {
            currentNode = queue.splice(0, 1)[0];
            positions.push({
                label:currentNode.node.value, 
                position: currentNode.position, 
                connectTo: currentNode.connectTo,
                index});
            index += 1;
            children = currentNode.node.find_children();
            splittedWidth = currentNode.availableWidth / (2 * children.length);
            children.map(x => {
                element = {
                    node: x,
                    position: {
                        x: currentNode.startX + splittedWidth * (children.indexOf(x) * 2+1), 
                        y: currentNode.position.y + configMeta.circleRadius * 3},
                    connectTo: [],
                    availableWidth: splittedWidth * 2,
                    startX: currentNode.startX + splittedWidth * (children.indexOf(x) * 2)
                };
                queue.push(element);
                currentNode.connectTo.push(element.position);
            })
        }
        return positions;
    }

    this.visualizeTree = function(highlights={}, configVisual=configMeta) {
        let positions = this.arrangePositions();
        let originalColor = configVisual.circleBorder;
        positions.map((x) => {
            x.connectTo.map(y => {
                this.drawLine(x.position.x, x.position.y, y.x, y.y);
            });
            if (highlights[`${x.index}`] != undefined) {
                configVisual.circleBorder = highlights[`${x.index}`];
            }
            this.drawRectangle(x.position.x, x.position.y, x.label, highlights[`${x.index}`] != undefined, configVisual);
            configVisual.circleBorder = originalColor;
        })
    }

    


}


export default Metatree;