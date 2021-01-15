import config from "./config.js";

let Metaarray = function(width, height, canvasX, canvasY, canvas=undefined, array=[], configMeta=config) {
    this.array = array;
    this.properties = {
        width, height, x:canvasX, y:canvasY
    }
    if (canvas == undefined) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.properties.x = 0;
        this.properties.y = 0;
    } else {
        this.canvas = canvas;
    }

    this.getFontLength = function(label, configFontLength=configMeta) {
        return configFontLength.labelFontSize * label.length;
    }

    this.drawRectangle = function(x, y, label="", highlight=false, configRect=configMeta) {
        let cursor = this.canvas.getContext('2d');

        let widthRect = configRect.circleRadius * 2;
        let heightRect = widthRect;
        let textLength = this.getFontLength(label);

        widthRect = widthRect < textLength?textLength:widthRect;

        cursor.strokeStyle = configRect.circleBorder;
        cursor.strokeRect(x, y, widthRect, heightRect);

        cursor.fillStyle = configRect.circleFill;
        cursor.fillRect(x, y, widthRect, heightRect);

        if (highlight) {
            cursor.strokeRect(x+1, y+1, widthRect-2, heightRect-2);
        }

        cursor.textAlign = "center";
        cursor.font = `${configRect.labelFontSize}px ${configRect.labelFontType}`;
        cursor.strokeText(label, x+widthRect/2, y+heightRect/2);
    }

    this.arrangePositions = function(configPosition=configMeta) {
        let positions = [];
        let startPosition = {x:this.properties.x+configPosition.canvasBorder, y:this.properties.y + configPosition.canvasBorder};
        let current = {x:startPosition.x, y:startPosition.y};
        this.array.map(x => {
            if (this.array.indexOf(x) % 10 == 0) {
                current.y += 2 * configPosition.circleRadius + configPosition.spaceBetween;
                current.x = startPosition.x;
            } else {
                current.x += 2 * configPosition.circleRadius + configPosition.spaceBetween;
            }
            positions.push({x:current.x, y:current.y, label:x, index: this.array.indexOf(x)});
        });
        return positions;
    }

    this.visualizeArray = function(highlights={}, configVisual=configMeta) {
        let originalColor = configVisual.circleBorder;
        this.arrangePositions().map(x => {
            
            if (highlights[`${x.index}`]) {
                configVisual.circleBorder = highlights[x.index];
            }
            this.drawRectangle(x.x, x.y, x.label, highlights[`${x.index}`] != undefined, configVisual);
            configVisual.circleBorder = originalColor;
        })
    }

}

export default Metaarray;