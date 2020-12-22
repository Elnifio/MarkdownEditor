/**
 * 
 * Author: Elnifio
 * GitHub: https://github.com/Elnifio
 */

import katex from '../node_modules/katex/dist/katex.mjs';
import GraphVisual from '../DrawingKits/VisualizationKit/graphVisual.js';

let defaultcanvasaes = {
    width:500,
    height:500
}

let defaultaes = {

    paragraph: { // style for paragraph
        // 'border-bottom':'5px solid red',
        
    }, 
    italic: { // style for ITALIC
        'font-style':'italic',

    }, 
    bold: { // style for BOLD
        'font-weight':'bold',
    }, 
    header: { // style for HEADERS

    }, 
    strikethrough: {
        'text-decoration':'line-through',
    },
    link: {

    },
    code: {
        "color":"#808080",
        'border':'1px solid #d9d9d9',
        'font-family':'"Courier New"',
    },
    underline: {
        'text-decoration':'underline',
    },
    reference: {
        'padding-left':'10px',
        'border-left':'3px solid red',
    },
    codeblock: {
        'color':'#808080',
        'border':"1px dashed #d9d9d9",
        'font-family':'"Courier New"',
    }

}


let Renderer = function(parser, aes=defaultaes) {
    this.current = parser.head;
    this.doc = document.createElement("div");
    this.environment = {
        insideP: false,
        Return: false,
        prevIndent: undefined,
        liststack: [],
        liststacklen: 0,
        ulcount: 0,
        olcount:0,
        lastlist: undefined,
        currentdoc: undefined,
        codetype: undefined,
    }

    this.init = function() {
        this.doc = document.createElement("div");
        this.environment = {
            insideP: false,
            Return: false,
            prevIndent: undefined,
            liststack: [],
            liststacklen: 0,
            ulcount: 0,
            olcount:0,
            lastlist:undefined,
            currentdoc: undefined,
            codetype: undefined,
        }
        this.current = parser.head;
    }

    this.renderSingle = function() {
        if (this.current.status != "RETURN" || this.current.status != "SPLIT") {
            this.environment.Return = false;
        }

        let alreadyAdded, newElement;

        switch(this.current.status) {
            case "NEW":
                currentdoc = this.doc;
                break;
            case "P":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph');
                newElement.innerHTML = this.current.context;
                currentdoc.append(newElement);
                // this.doc += (`<span class="paragraph">${this.current.context}</span>`);
                break;
            case "ITALIC":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph italic');
                newElement.innerHTML = this.current.context;
                currentdoc.append(newElement);
                // this.doc += (`<span class="paragraph italic">${this.current.context}</span>`);
                break;
            case "BOLD":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph bold');
                newElement.innerHTML = this.current.context;
                currentdoc.append(newElement);
                // this.doc += (`<span class="paragraph bold">${this.current.context}</span>`);
                break;
            case "ITALICBOLD":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph italic bold');
                newElement.innerHTML = this.current.context;
                currentdoc.append(newElement);
                // this.doc += (`<span class="paragraph bold italic">${this.current.context}</span>`);
                break;
            case "HEADER":
                newElement = document.createElement(`h${this.current.config.header}`);
                newElement.setAttribute('class', `paragraph header h${this.current.config.header}`);
                newElement.innerHTML = this.current.context;
                currentdoc.append(newElement);
                // this.doc += (`<h${this.current.config.header} class='paragraph header h${this.current.config.header}'>${this.current.context}</h${this.current.config.header}>`);
                break;
            case "RETURN":
                currentdoc = this.doc;
                if (!this.environment.Return) {
                    this.environment.Return = true;
                    currentdoc.append(document.createElement("br"));
                    // this.doc += (`<br />`);
                }

                // while (this.environment.liststack.length > 0) {
                //     let top = this.environment.liststack.pop();
                //     this.doc += `</${top}>`;
                // }
                this.environment.liststack = [];
                this.environment.liststacklen = 0;
                this.environment.prevIndent = undefined;
                this.environment.lastlist = undefined;

                break;
            case "SPLIT":
                currentdoc = this.doc;
                this.environment.liststack = [];
                this.environment.liststacklen = 0;
                this.environment.lastlist = undefined;
                // while (this.environment.liststack.length > 0) {
                //     let top = this.environment.liststack.pop();
                //     this.doc += `</${top}>`;
                // }
                // this.doc += (`<hr />`);
                currentdoc.append(document.createElement("hr"));
                break;
            case "STRIKETHROUGH":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph strikethrough`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph strikethrough">${this.current.context}</span>`);
                break;
            case "LINK":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph link`);
                newElement.innerHTML = `<a href=${this.current.config.src}>${this.current.context}</a>`;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph link"><a href="${this.current.config.src}">${this.current.context}</a></span>`);
                break;
            case "CODE":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph code`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph code">${this.current.context}</span>`);
                break;
            case "UNDERLINE":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph underline">${this.current.context}</span>`);
                break;
            case "UNDERLINEITALIC":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline italic`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph underline italic">${this.current.context}</span>`);
                break;
            case "UNDERLINEBOLD":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline bold`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph underline bold">${this.current.context}</span>`);
                break;
            case "UNDERLINEITALICBOLD":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline italic bold`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<span class="paragraph underline italic bold">${this.current.context}</span>`);
                break;
            case "IMAGE":
                newElement = document.createElement(`img`);
                newElement.setAttribute("src", this.current.config.src);
                newElement.setAttribute('alt', this.current.context);
                this.doc.append(newElement);
                // this.doc += (`<img src="${this.current.config.src}" alt=${this.current.context}>`);
                break;
            case "REFERENCE":
                newElement = document.createElement(`div`);
                newElement.setAttribute('class', `reference`);
                newElement.innerHTML = this.current.context;
                this.doc.append(newElement);
                // this.doc += (`<div class="reference">${this.current.context}</div>`);
                break;
            case "CODETYPE":
                this.environment.codetype = this.current.context;
                break;
            case "CODEBLOCK":
                // DO RENDER CODE HERE
                // this.doc.append(this.renderCode());
                break;
            case "UL":
                if (this.current.config.indent == undefined) {this.current.config.indent = 0};

                if (this.environment.liststack[this.environment.liststacklen-1].nodeName.toLowerCase() != "ul") {
                    newElement = document.createElement("ul");
                    this.environment.liststack.push(newElement);
                    this.environment.lastlist = newElement;
                }

                if (this.environment.prevIndent == undefined) {
                    this.environment.prevIndent = this.current.config.indent;
                    newElement = document.createElement('li');
                }
                
                // alreadyAdded = false;
                // if (this.current.config.indent == undefined) {this.current.config.indent = 0}

                // if (this.environment.liststack.indexOf("ul") < 0) {
                //     this.environment.liststack.push("ul");
                //     this.doc += "<ul>";
                //     alreadyAdded = true;
                // }

                // if (this.environment.prevIndent == undefined) {
                //     this.environment.prevIndent = this.current.config.indent;
                //     this.doc += "<li>";
                // } else {
                //     if (this.environment.prevIndent < this.current.config.indent && !alreadyAdded) {
                //         this.doc += "</li><ul><li>";
                //         this.environment.liststack.push("ul");
                //     } else if (this.environment.prevIndent > this.current.config.indent) {
                //         let top = this.environment.liststack.pop();
                //         this.doc += `</li></${top}><li>`;
                //     } else {
                //         this.doc += "</li><li>";
                //     }
                // }
                // this.environment.prevIndent = this.current.config.indent;
                break;
            case "OL":
                alreadyAdded = false;
                if (this.current.config.indent == undefined) {this.current.config.indent = 0}
                if (this.environment.liststack.indexOf("ol") < 0) {
                    this.doc += "<ol>";
                    this.environment.liststack.push("ol");
                    alreadyAdded = true;
                }
                if (this.environment.prevIndent == undefined) {
                    this.environment.prevIndent = this.current.config.indent;
                    this.doc += "<li>";
                } else {
                    if (this.environment.prevIndent < this.current.config.indent && !alreadyAdded) {
                        this.doc += "</li><ol><li>";
                        this.environment.liststack.push("ol");
                    } else if (this.environment.prevIndent > this.current.config.indent) {
                        let top = this.environment.liststack.pop();
                        this.doc += `</li></${top}><li>`;
                    } else {
                        this.doc += "</li><li>";
                    }
                }
                this.environment.prevIndent = this.current.config.indent;
                break;
            case "HTML":
                if (this.current.config.doRender) {
                    this.doc += (`<div>${this.current.context}</div>`);
                } else {
                    this.doc += (`<div>${this.current.context.replace(/\</g, '&lt;').replace(/\>/g, '&gt;')}</div>`);
                }
                
                break;
            default: 
                console.log(`Status ${this.current.status} with context ${this.current.context} not rendered`);
        }
    };

    this.renderCode = function() {
        let out = "";
        if (this.environment.codetype == undefined) {
            console.log("Missing Code Type error");
        } 

        else if (this.environment.codetype == 'latex') {
            out = `<div>`;
            out += this.renderLatex(this.current.context);
            out += "</div>";
        }

        else if (this.environment.codetype.includes(":")) {
            let splitted = this.environment.codetype.split(":");
            let classifier = splitted[0];
            let status = splitted[1];
            switch(classifier) {
                case "dg":
                case "ug":
                    switch(status) {
                        case "init":
                            new GraphVisual(this.current.context, );
                            break;
                        case "mst":
                            break;
                        default:
                            console.log("not supported");
                    }
                    break;
                case "pq":
                    console.log(`rendering ${classifier} with status ${status}, and context ${this.current.context};`);
                    break;
                case "tree":
                    console.log(`rendering ${classifier} with status ${status}, and context ${this.current.context};`);
                    break;
                case "ll":
                    console.log(`rendering ${classifier} with status ${status}, and context ${this.current.context};`);
                    break;
                default:
                    console.log(`classifier ${classifier} not supported;`);
            }
        }
        
        else {
            out = `<span class="codeblock">${this.current.context.replace(/\n/g, "<br>").replace(/\s/g, "&nbsp;")}</span>`;
        }
        this.environment.codetype = undefined;
        return out;
    }

    this.parseGraph = function(context, graphName) {
        
    }

    this.renderLatex = function(context) {
        let out = "";
        out += katex.renderToString(context, {
                throwOnError: false,
                output:'html'
        });
        return out;
    }

    this.processStyle = function() {
        let out = "<style>";
        for (let i in aes) {
            out += `.${i} {`;
            for (let j in aes[i]) {
                out += `${j}:${aes[i][j]};`;
            }
            out += "}";
        }
        out += "</style>";
        return out;
    }

    this.loadResource = function() {
        let out = "";
        // loading latex resource:
        out += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.css" integrity="sha384-qCEsSYDSH0x5I45nNW4oXemORUZnYFtPy/FqB/OjqxabTMW5HVaaH9USK4fN3goV" crossorigin="anonymous">`;
        out += "\n";
        return out;
    }

    this.renderPage = function(options={
        renderStyle:false,
        renderResource:false,
    }) {
        this.init();

        if (options.renderStyle) {
            this.doc += this.processStyle();    
        }

        this.doc += "\n";

        if (options.renderResource) {
            this.doc += this.loadResource();
        }

        this.doc += "\n";

        while (this.current != undefined) {
            this.renderSingle();
            this.current = this.current.next;
        }
    }

    this.render = function() {
        this.renderPage();
        return this.doc;
    }
}

export default Renderer;