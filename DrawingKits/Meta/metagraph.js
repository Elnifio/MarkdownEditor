import config from "./config.js"
import Graph from "../DataStructure/graph.js"

let Metagraph = function(width, height, canvasX=0, canvasY=0, canvas=undefined, directed=true, graph=undefined, configMeta=config) {
    this.directed = directed;
    this.radius = configMeta.circleRadius;
    this.border = configMeta.canvasBorder;
    this.config = configMeta;

    if (canvas == undefined) {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "testCanvas";
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.border = configMeta.canvasBorderStyle;
    } else {
        this.canvas = canvas;
    }

    if (graph == undefined) {
        this.graph = new Graph(directed);
    } else {
        this.graph = graph;
    }

    this.drawCircle = function(x, y, label="", configCircle=configMeta) {
        let cursor = this.canvas.getContext("2d");
        cursor.strokeStyle = configCircle.circleBorder;
        cursor.beginPath();
        cursor.arc(x, y, configCircle.circleRadius, 0, Math.PI * 2, true);
        cursor.fillStyle = configCircle.circleFill;
        cursor.fill();
        cursor.stroke();
        if (config.haveNodeLabel) {
            cursor.font = `${configCircle.labelFontSize}px '${configCircle.labelFontType}'`;
            cursor.textAlign = "center";
            cursor.strokeText(label, x, y);
        }
    };
    
    this.clearCanvas = function() {
        let cursor = this.canvas.getContext("2d");
        cursor.clearRect(canvasX, canvasY, width, height);
    };

    this.resetCanvas = function() {
        this.clearCanvas();
        if (graph == undefined) {
            this.graph = this.directed?(new DirectedGraph()):(new UndirectedGraph());
        } else {
            this.graph = graph;
        }
    }

    this.drawLine = function(x1, y1, x2, y2, label="", configLine=configMeta) {
        let cursor = this.canvas.getContext("2d");
        cursor.beginPath();
        cursor.moveTo(x1, y1);
        cursor.strokeStyle=configLine.lineColor;
        cursor.lineTo(x2, y2);
        cursor.stroke();

        if (config.haveLineLabel) {
            cursor.strokeStyle = configLine.labelColor;
            cursor.font = `${configLine.labelFontSize}px '${configLine.labelFontType}'`;
            cursor.strokeText(label, (x1+x2)/2, (y1+y2)/2);
        }
    }

    this.drawArrow = function(startX, startY, endX, endY, label="", configArrow=configMeta) {
        let cursor = this.canvas.getContext("2d");
        cursor.strokeStyle = configArrow.lineColor;
        cursor.beginPath();
        cursor.moveTo(startX, startY);
        cursor.lineTo(endX, endY);
        cursor.stroke();

        let triangleHeight = distance(startX, startY, endX, endY) / 10;
        let triangleWidth = triangleHeight / 2;
        let triangleX = startX + (endX - startX) * 2/3;
        let triangleY = startY + (endY - startY) * 2/3;
        let line = solveKB(startX, startY, endX, endY);
        // console.log(`${triangleX}, ${triangleY}`);

        let triangle = {
            p1: {x:undefined, y:undefined}, 
            p2: {x:undefined, y:undefined}, 
            p3:{x:startX + (endX - startX) * 5/6, y:startY + (endY - startY) * 5/6}};
        // console.log(triangle);
        if (line.x) {
            // perpendicular = {k:undefined, b:undefined, y:triangleY, x:undefined};
            triangle.p1 = {x:line.x-triangleWidth/2, y:triangleY};
            triangle.p2 = {x:line.x+triangleWidth/2, y:triangleY};
        } else if (line.y) {
            // perpendicular = {k:undefined, b:undefined, y:undefined, x:triangleX};
            triangle.p1 = {x:triangleX, y:line.y-triangleWidth/2};
            triangle.p2 = {x:triangleX, y:line.y+triangleWidth/2};
        } else {
            // k' * k = -1
            // (triangleY = k' * triangleX + b') -> b' = triangleY - k' * triangleX
            let kp = -1 / line.k;
            let bp = triangleY - kp * triangleX;
            // y1 = k' * x1 + b'
            // y2 = k' * x2 + b'
            // (triangleWidth/2)**2 = (y1-triangleY)**2 + (x1-triangleX)**2
            // -> d**2 = y**2 + trY**2 - 2*y*trY + x**2 + trX**2 - 2*x*trX
            // y = k' * x + b'
            // -> d**2 = (k' * x + b')**2 + trY**2 - 2*(k'*x+b')*trY + x**2 + trX**2 - 2*x*trX
            // -> d**2 = k'**2 * x**2 + b'**2 + 2*k'*x*b' + trY**2 - 2*k'*x*trY - 2*b'*trY + x**2 + trX**2 - 2*x*trX
            // -> 0 = x**2 * (k'**2 + 1)  + x * (-2*trX - 2*k'*trY + 2*k'*b') + (b'**2 + trY**2 + trX**2 - 2*b'*trY - d**2)
            // -> a = k'**2 + 1
            // -> b = (-2*trX - 2*k'*trY + 2*k'*b')
            // -> c = (b'**2 + trY**2 + trX**2 - 2*b'*trY - d**2)
            let a = kp**2 + 1;
            let b = (-2 * triangleX - 2*kp*triangleY + 2*kp*bp);
            let c = (bp**2 + triangleY**2 + triangleX**2 - 2*bp*triangleY - (triangleWidth/2)**2);
            // formula: -b(+-)Sqrt(b**2 - 4*a*c)/2a
            let xs = {neg:((-b-Math.sqrt(b**2-4*a*c))/(2*a)),pos:((-b+Math.sqrt(b**2-4*a*c))/(2*a))};
            triangle.p1 = {x:xs.neg, y:kp*xs.neg+bp};
            triangle.p2 = {x:xs.pos, y:kp*xs.pos+bp};
        }
        
        cursor.fillStyle = configArrow.lineColor;
        cursor.beginPath();
        // console.log(`Moving to ${triangle.p1.x}, ${triangle.p1.y}`);
        cursor.moveTo(triangle.p1.x, triangle.p1.y);
        // console.log(`Moving to ${triangle.p2.x}, ${triangle.p2.y}`);
        cursor.lineTo(triangle.p2.x, triangle.p2.y);
        // console.log(`Moving to ${triangle.p3.x}, ${triangle.p3.y}`);
        cursor.lineTo(triangle.p3.x, triangle.p3.y);
        cursor.fill();

        if (configArrow.haveLineLabel) {
            cursor.strokeStyle = configArrow.labelColor;
            cursor.font = `${configArrow.labelFontSize}px '${configArrow.labelFontType}'`;
            cursor.strokeText(label, triangle.p1.x, triangle.p1.y);
        }

    }

    this.arrangePositions = function() {
        let nodes = this.graph.get_all_nodes().sort();
        let centers = [];
        let polygonCenter = {x:(canvasX + width/2), y: (canvasY + height/2)};
        let maxAvailable = width<height?(width/2-this.radius-this.border):(height/2-this.radius-this.border);
        let angle = 2 * Math.PI / nodes.length;
        for (let i = 0; i < nodes.length;i++) {
            centers[nodes[i]] = {
                x: polygonCenter.x + maxAvailable * Math.sin(i*angle),
                y: polygonCenter.y - maxAvailable * Math.cos(i*angle)
            };
        }
        return centers;
    }

    this.visualizeGraph = function(highlights={edges:{}, nodes:{}}, configVisual=configMeta) {
        let centers = this.arrangePositions();
        configVisual.haveLineLabel = this.graph.renderWeight;
        let connected, originalColor;
        for (let e in centers) {
            connected = this.graph.get_connect(e);
            for (let t in connected) {
                originalColor = configVisual.lineColor;
                if (highlights.edges[`${e}`]) {
                    if (highlights.edges[`${e}`][`${t}`]) {
                        configVisual.lineColor = highlights.edges[`${e}`][`${t}`];
                    }
                }
                if (this.graph.directed) {
                    this.drawArrow(centers[e].x, centers[e].y, centers[t].x, centers[t].y, connected[t], configVisual);
                } else {
                    this.drawLine(centers[e].x, centers[e].y, centers[t].x, centers[t].y, connected[t], configVisual);
                }
                configVisual.lineColor = originalColor;
            }
        }
        for (let e in centers) {
            originalColor = configVisual.circleBorder;
            if (highlights.nodes[`${e}`]) {
                configVisual.circleBorder = highlights.nodes[`${e}`];
            }
            this.drawCircle(centers[e].x, centers[e].y, e, configVisual);
            configVisual.circleBorder = originalColor;
        }
    }

    this.updateGraph = function(highlights={edges:{}, nodes:{}}, configUpdate=configMeta) {
        this.clearCanvas();
        this.visualizeGraph(highlights, configUpdate);
    }

    this.insertNode = function(name) {
        this.graph.insert_node(name);
        let highlights = {edges:{}, nodes: {}};
        highlights.nodes[`${name}`] = {
            circleBorder:configMeta.highlightBorder, 
            circleFill:configMeta.highlightFill};
        this.updateGraph(highlights);
    }

    this.insertEdge = function(s, e, w) {
        this.graph.insert_edge(s, e, w);
        let highlights = {edges: {}, nodes: {}}
        highlights.edges[`${s}`] = {};
        highlights.edges[`${s}`][`${e}`] = configMeta.highlightLineColor;
        this.updateGraph(highlights);
    }

    this.deleteNode = function(name) {
        this.graph.delete_node(name);
        this.updateGraph();
    }

    this.deleteEdge = function(s, e) {
        this.graph.delete_edge(s, e);
        this.updateGraph();
    }

    this.checkNode = function(name) {
        return this.graph.check_node(name);
    }

    this.checkEdge = function(s, e) {
        return this.graph.check_edge(s,e);
    }

    this.getAllNodes = function() {
        return this.graph.get_all_nodes();
    }

    this.getConnect = function(name) {
        return this.graph.get_connect(name);
    }

}

let distance = function(startX, startY, endX, endY) {
    return Math.sqrt((endX-startX)**2 + (endY-startY)**2);
}

let solveKB = function(startX, startY, endX, endY) {
    // y1 = x1 * k + b
    // y2 = x2 * k + b
    // -> 
    // (y2 - y1) = (x2 - x1) * k
    // k = (y2 - y1) / (x2 - x1)
    // b = y1 - x1 * k
    if (Math.abs(startY - endY) < 0.0001) {
        return {k: undefined, b: undefined, y: startY, x: undefined};
    } else if (Math.abs(startX - endX) < 0.0001) {
        return {k: undefined, b: undefined, y: undefined, x: startX};
    } else {
        let k = (endY - startY)/(endX - startX);
        return {k, b: startY - startX * k, y:undefined, x:undefined};
    }
}

export default Metagraph;