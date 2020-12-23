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

let datastructureRE = /(?<ds>(graph|pq|ll|arr|bst|tree))(?<modifier>\:\w*)?(?<varname> as \w+)?(?<option> norender)?/;


let Renderer = function(parser, aes=defaultaes, id='renderer') {
    this.current = parser.head;
    this.doc = document.createElement("div");
    this.doc.setAttribute('id', id);
    this.environment = {
        insideP: false,
        Return: false,
        prevIndent: undefined,
        liststack: [],
        liststacklen: 0,
        ulcount: 0,
        olcount:0,
        currentlist: undefined,
        currentdoc: undefined,
        codetype: undefined,
    }

    this.init = function() {
        this.doc = document.createElement("div");
        this.doc.setAttribute('id', id);
        this.environment = {
            insideP: false,
            Return: false,
            prevIndent: undefined,
            liststack: [],
            liststacklen: 0,
            ulcount: 0,
            olcount:0,
            currentlist:undefined,
            currentdoc: undefined,
            codetype: undefined,
        }
        this.current = parser.head;
    }

    this.renderSingle = function() {
        if (this.current.status != "RETURN" || this.current.status != "SPLIT") {
            this.environment.Return = false;
        }

        let newElement; // this is used as general "newly created element";
        let cstatus, rstatus;   // this is used in case "UL" and "OL", 
                                // with one representing current.status 
                                // and other representing the "reverse option"

        switch(this.current.status) {
            case "NEW":
                this.environment.currentdoc = this.doc;
                break;

            case "P":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph');
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "ITALIC":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph italic');
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "BOLD":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph bold');
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "ITALICBOLD":
                newElement = document.createElement('span');
                newElement.setAttribute('class', 'paragraph italic bold');
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "HEADER":
                newElement = document.createElement(`h${this.current.config.header}`);
                newElement.setAttribute('class', `paragraph header h${this.current.config.header}`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "RETURN":
                this.environment.currentdoc = this.doc;
                if (!this.environment.Return) {
                    this.environment.Return = true;
                    this.environment.currentdoc.append(document.createElement("br"));
                }

                this.environment.liststack = [];
                this.environment.liststacklen = 0;
                this.environment.prevIndent = undefined;
                this.environment.currentlist = undefined;

                break;

            case "SPLIT":
                this.environment.currentdoc = this.doc;

                this.environment.liststack = [];
                this.environment.liststacklen = 0;
                this.environment.currentlist = undefined;

                this.environment.currentdoc.append(document.createElement("hr"));
                break;

            case "STRIKETHROUGH":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph strikethrough`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "LINK":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph link`);
                newElement.innerHTML = `<a href=${this.current.config.src}>${this.current.context}</a>`;
                this.environment.currentdoc.append(newElement);
                break;
            case "CODE":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph code`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;
            case "UNDERLINE":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;
            case "UNDERLINEITALIC":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline italic`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "UNDERLINEBOLD":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline bold`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "UNDERLINEITALICBOLD":
                newElement = document.createElement(`span`);
                newElement.setAttribute('class', `paragraph underline italic bold`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "IMAGE":
                newElement = document.createElement(`img`);
                newElement.setAttribute("src", this.current.config.src);
                newElement.setAttribute('alt', this.current.context);
                this.environment.currentdoc.append(newElement);
                break;

            case "REFERENCE":
                newElement = document.createElement(`div`);
                newElement.setAttribute('class', `reference`);
                newElement.innerHTML = this.current.context;
                this.environment.currentdoc.append(newElement);
                break;

            case "CODETYPE":
                this.environment.codetype = this.current.context;
                break;

            case "CODEBLOCK":
                // TODO: DO RENDER CODE HERE
                this.environment.currentdoc.append(this.renderCode());
                // this.environment.currentdoc.append(this.renderCode());
                break;

            case "UL":
            case "OL":
                cstatus = this.current.status;
                rstatus = (cstatus == "UL")?"OL":"UL";
                // handling of special values where indent is not defined
                if (this.current.config.indent == undefined) this.current.config.indent = 0;

                // if currentlist is not defined: we are creating a new list;
                // create a new list with current indent, 
                // and point our currentlist object to this list, with current indent
                // append this new list to our document

                
                if (this.environment.currentlist == undefined) {
                    newElement = document.createElement(cstatus);
                    // newElement = document.createElement('ul');
                    this.environment.currentlist = {list:newElement, indent:this.current.config.indent};
                    this.environment.currentdoc.append(newElement);

                    newElement = document.createElement('li');
                    this.environment.currentlist.list.append(newElement);
                    this.environment.currentdoc = newElement;
                } 
                
                // else if: currentlist is not UL: we should change according to the indentation;
                // create a new list with current indent;
                // else if (this.environment.currentlist.list.tagName != 'ul') {
                else if (this.environment.currentlist.list.tagName != cstatus) {
                    newElement = document.createElement(cstatus);
                    // newElement = document.createElement('ul');

                    if (this.environment.currentlist.indent > this.current.config.indent) {
                    // if we have a new indent that is smaller than current working indent: 
                    // this should be of the following format: 
                    /*
                        ...
                            15. ...
                            16. ...
                                - ...
                                1. ...
                        - at here, this indent is smaller than our current working indent.
                        - we should pop from the liststack until we find an indent 
                        - that is smaller or equal to this new indent
                    */
                    // we should first locate an indent that is smaller or equal to current indent (use a while loop)
                    // and either: 
                    //      1. if indent is smaller than current indent:
                    //          - if currently at a ul: we create a new ul element under current ul as a sub-list
                    //               append li to it, and switch our current doc to this li.
                    //          - if currently at a ol: we create a new ul element under current ol as a sub-list
                    //               append li to it, and switch our current doc to this li.
                    //      2. if indent is equal to current indent: 
                    //          - if currently at a ul: we create a new li element under this ul
                    //               and switch our current doc to this li
                    //          - if currently at a ol: we create a new ul element and pop another item from liststack: 
                    //              - if newly popped is a list: we append our newly created ul to this list
                    //              - else if none popped out: current doc switched to this.doc, and we append our newly created ul to here
                    //              After we finished, we create a new li element under this newly created list, and switch our currentdoc to here
                    //      3. if currently at undefined (did not find an indent that is smaller or equal to current indent):
                    //          switch our context to this.doc, create and insert a new ul element under this.doc, and switch to li
                        while (this.environment.currentlist != undefined && this.environment.currentlist.indent > this.current.config.indent) {
                            this.environment.currentlist = this.environment.liststack.pop();
                        }

                        // Situation 3
                        if (this.environment.currentlist == undefined) {
                            this.environment.currentdoc = this.doc;
                            this.environment.currentdoc.append(newElement);
                            this.environment.currentlist = {list:newElement, indent:this.current.config.indent};
                            newElement = document.createElement('li');
                            this.environment.currentlist.list.append(newElement);
                            this.environment.currentdoc = newElement;
                        }

                        // Situation 2
                        else if (this.environment.currentlist.indent == this.current.config.indent) {
                            // if (this.environment.currentlist.list.tagName == "UL") {
                            if (this.environment.currentlist.list.tagName == cstatus) {
                                newElement = document.createElement('li');
                                this.environment.currentlist.list.append(newElement);
                                this.environment.currentdoc = newElement;
                            } 
                            
                            // else if (this.environment.currentlist.list.tagName == "OL") {
                            else if (this.environment.currentlist.list.tagName == rstatus) {
                                this.environment.currentlist = this.environment.liststack.pop();
                                if (this.environment.currentlist == undefined) {
                                    this.environment.currentdoc = this.doc;
                                    this.environment.currentdoc.append(newElement);
                                    this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                                    newElement = document.createElement('li');
                                    this.environment.currentlist.list.append(newElement);
                                    this.environment.currentdoc = newElement;
                                } else {
                                    this.environment.currentlist.list.append(newElement);
                                    this.environment.liststack.push(this.environment.currentlist);
                                    this.environment.currentlist = {list:newElement, indent:this.current.config.indent};
                                    newElement = document.createElement('li');
                                    this.environment.currentlist.list.append(newElement);
                                    this.environment.currentdoc = newElement;
                                }
                            } else { console.log(`${this.environment.currentlist.list.tagName} not encountered for ${cstatus} with reversing as ${rstatus};`); }
                        }

                        // Situation 1
                        else if (this.environment.currentlist.indent < this.current.config.indent) {
                            this.environment.currentlist.list.append(newElement);
                            this.environment.liststack.push(this.environment.currentlist);
                            this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                            newElement = document.createElement('li');
                            this.environment.currentlist.list.append(newElement);
                            this.environment.currentdoc = newElement;
                        }

                        // error handling
                        else {
                            console.log(`unexpected situation occured at ${cstatus} with reverse ${rstatus}`);
                        }
                    }

                    else if (this.environment.currentlist.indent < this.current.config.indent) {
                        // if we have a new indent that is larger than our current indent: 
                        // we create a new sub-list within our current list
                        // archive our currentlist, switch currentlist to this newly added list
                        // add a li to this newly added list, and switch our context to this list
                        this.environment.currentlist.list.append(newElement);
                        this.environment.liststack.push(this.environment.currentlist);
                        this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                        newElement = document.createElement('li');
                        this.environment.currentlist.list.append(newElement);
                        this.environment.currentdoc = newElement;
                    }

                    else {
                        // if we have a new indent that is equal to our current list:
                        // since we are currently not inside a UL, we find its parent, 
                        // and append this new UL to its parent
                        //      1. If the stack is now empty, we add this newly created list to this.doc, and set currentlist to this list;
                        //      2. Else: We add this newly created list to this recently removed list, and set currentlist to this newly created list;
                        this.environment.currentlist = this.environment.liststack.pop();
                        if (this.environment.currentlist == undefined) {
                            this.environment.currentdoc = this.doc;
                            this.environment.currentdoc.append(newElement);
                            this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                            newElement = document.createElement('li');
                            this.environment.currentlist.list.append(newElement);
                            this.environment.currentdoc = newElement;
                        } 
                        
                        else {
                            this.environment.currentlist.list.append(newElement);
                            this.environment.liststack.push(this.environment.currentlist);
                            this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                            newElement = document.createElement('li');
                            this.environment.currentlist.list.append(newElement);
                            this.environment.currentdoc = newElement;
                        }
                    }
                }
                
                // Else: currentlist is a UL: we should change behavior according to the indentation;
                else {
                    // If we have a new indent that is smaller than our current indent: 
                    // similar as above, we should first locate one with indent smaller than new indent
                    //      1. If current list is not defined:
                    //          adjust our currentdoc to this.doc, create a new UL, append this UL to our current doc
                    //          switch currentlist to this UL
                    //          add a new li to currentlist, and switch our context to this li
                    //      2. if current list indent == new indent: 
                    //          - Since we know that current list is UL: 
                    //              create a new li, append it to current list;
                    //      3. if current list indent < new indent: 
                    //         create a new UL sublist within this new list
                    if (this.environment.currentlist.indent > this.current.config.indent) {
                        while (this.environment.currentlist != undefined && this.environment.currentlist.indent > this.current.config.indent) {
                            this.environment.currentlist = this.environment.liststack.pop();
                        }

                        // Situation 1:
                        if (this.environment.currentlist == undefined) {
                            // newElement = document.createElement('ul');
                            newElement = document.createElement(cstatus);
                            this.environment.currentdoc = this.doc;
                            this.environment.currentdoc.append(newElement);
                            this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                            newElement = document.createElement('li');
                            this.environment.currentlist.list.append(newElement);
                            this.environment.currentdoc = newElement;
                        } 

                        // Situation 2:
                        else if (this.environment.currentlist.indent == this.current.config.indent) {
                            if (this.environment.currentlist.list.tagName == cstatus) {
                                newElement = document.createElement('li');
                                this.environment.currentlist.list.append(newElement);
                                this.environment.currentdoc = newElement;
                            } 
                            
                            // else if (this.environment.currentlist.list.tagName == "OL") {
                            else if (this.environment.currentlist.list.tagName == rstatus) {
                                this.environment.currentlist = this.environment.liststack.pop();
                                if (this.environment.currentlist == undefined) {
                                    // newElement = document.createElement("ul");
                                    newElement = document.createElement(cstatus);
                                    this.environment.currentdoc = this.doc;
                                    this.environment.currentdoc.append(newElement);
                                    this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                                    newElement = document.createElement('li');
                                    this.environment.currentlist.list.append(newElement);
                                    this.environment.currentdoc = newElement;
                                } 
                                
                                else {
                                    // newElement = document.createElement('ul');
                                    newElement = document.createElement(cstatus);
                                    this.environment.currentlist.list.append(newElement);
                                    this.environment.liststack.append(this.environment.currentlist);
                                    this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                                    newElement = document.createElement('li');
                                    this.environment.currentlist.list.append(newElement);
                                    this.environment.currentdoc = newElement;
                                }
                            } else {
                                console.log(`${this.environment.currentlist.list.tagName} not encountered with ${cstatus} and reversing ${rstatus};`);
                            }
                        }

                        // Situation 3:
                        else if (this.environment.currentlist.indent < this.current.config.indent) {
                            // newElement = document.createElement('ul');
                            newElement = document.createElement(cstatus);
                            this.environment.currentlist.list.append(newElement);
                            this.environment.liststack.push(this.environment.currentlist);
                            this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                            newElement = document.createElement('li');
                            this.environment.currentlist.list.append(newElement);
                            this.environment.currentdoc = newElement;
                        }

                        // error handling
                        else {
                            console.log(`unexpected situation occured at ${cstatus} with reversing ${rstatus}`);
                        }

                    } 
                    
                    else if (this.environment.currentlist.indent == this.current.config.indent) {
                        newElement = document.createElement('li');
                        this.environment.currentlist.list.append(newElement);
                        this.environment.currentdoc = newElement;
                    }

                    else {
                        newElement = document.createElement(cstatus);
                        this.environment.currentlist.list.append(newElement);
                        this.environment.liststack.push(this.environment.currentlist);
                        this.environment.currentlist = {list: newElement, indent: this.current.config.indent};
                        newElement = document.createElement('li');
                        this.environment.currentlist.list.append(newElement);
                        this.environment.currentdoc = newElement;
                    }
                }
                break;
            case "HTML":
                if (this.current.config.doRender) {
                    newElement = document.createElement('div');
                    newElement.innerHTML = this.current.context;
                    this.environment.currentdoc.append(newElement);
                } else {
                    newElement = document.createElement('div');
                    newElement.innerHTML = this.current.context.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
                    this.environment.currentdoc.append(newElement);
                }
                break;
            default: 
                console.log(`Status ${this.current.status} with context ${this.current.context} not rendered`);
        }
    };

    this.renderCode = function() {
        let out = document.createElement('div');
        if (this.environment.codetype == undefined) {
            console.log("Missing Code Type error");
        }

        else {
            let rematch = this.environment.codetype.match(datastructureRE);
            let newObject, canvas;

            if (this.environment.codetype == 'latex') {
                this.renderLatex(this.current.context, out);
            }
    
            else if (rematch) {
                switch (rematch.groups.ds) {
                    case "graph":
                        if (rematch.groups.modifier == undefined || rematch.groups.modifier == ":init") {
                            canvas = document.createElement('canvas');
                            canvas.width = defaultcanvasaes.width;
                            canvas.height = defaultcanvasaes.height;

                            newObject = new GraphVisual(this.current.context, canvas, false, defaultcanvasaes.width, defaultcanvasaes.height, 0, 0);
                            if (rematch.groups.option == undefined) {
                                out.append(canvas);
                            }
                        }
                        break;
                    default: 
                        console.log(`unexpected ${rematch.groups.ds} at render code matching`);
                }
            }
            
            else {
                out.innerHTML = `<span>${this.current.context.replace(/\n/g, "<br>").replace(/\s/g, "&nbsp;")}</span>`;
                out.setAttribute('class', 'codeblock');
                // out = `<span class="codeblock">${this.current.context.replace(/\n/g, "<br>").replace(/\s/g, "&nbsp;")}</span>`;
            }
        }
        this.environment.codetype = undefined;
        return out;
    }

    this.parseGraph = function(context, graphName) {
        
    }

    this.renderLatex = function(context, element) {
        katex.render(context, element, { throwOnError: false, displayMode: true, output: 'html',  });
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

        // if (options.renderStyle) {
        //     this.doc += this.processStyle();    
        // }



        // if (options.renderResource) {
        //     this.doc += this.loadResource();
        // }

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