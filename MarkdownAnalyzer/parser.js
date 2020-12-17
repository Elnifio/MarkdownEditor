/**
 * 
 * Author: Elnifio
 * GitHub: https://github.com/Elnifio
 */

let Text = function(value) {
    let counter = 0;
    this.fetchone = function() {
        return value[counter++];
    }
}

/*
Status Codes:
    P: Paragraph, normal paragraph
    NEW: new node (new document)
    AWAITASTERISK: awaiting asterisk
    AWAITRETURN: awaiting return
    BOLD: bold 
    
    forgot to update rest of the status
*/
let Node = function() {
    this.status = "P";
    this.context = "";
    this.next = undefined;
    this.config = {};
    this.printNode = function(html=false) {
        let returnStr = (html)?"<br />":"\n";
        let wrapperStart = (html)?"<span>":"";
        let wrapperEnd = (html)?"</span>":"";
        let out = `${wrapperStart}[${this.status}]: '${this.context}'; (${JSON.stringify(this.config)})${wrapperEnd}`;
        // if (this.status == "RETURN") {
        //     out = `RETURN`;
        // }
        
        if (this.next == undefined) {
            return out;
        } else {
            out = out + `${returnStr}` + this.next.printNode(html);
            return out;
        }
    }

    this.gatherstatus = function() {
        let values = [];
        let curr = this;
        while (curr != undefined) {
            if (values.indexOf(curr.status) < 0) {
                values.push(curr.status);
            }
            curr = curr.next;
        }
        return values;
    }
}

let Parser = function(value) {
    let text = new Text(value);
    this.head = new Node();
    this.curr = this.head;
    this.curr.status = "NEW";
    this.cursor = "";

    this.step = function() {
        this.curr = parseSingle(this.curr, this.cursor, text);
        this.cursor = text.fetchone();
    }

    this.parse = function() {
        while (this.cursor != undefined) {
            this.step();
        }

        switch (this.curr.status) {
            case "WITHINITALIC":
                this.curr.status = "ITALIC";
                break;
            case "AWAITRETURN":
                this.curr.status = "P";
                break;
            case "AWAITTILDA":
                this.curr.status = "UNDERLINE";
                break;
            case "AWAITASTERISK":
                this.curr.status = "ITALIC";
                break;
        }
    }
}

// If newly created node - then create a new node with status "P"
let parseNEW = function(current) {
    current.next = new Node();
    current = current.next;
    current.status = "AWAITRETURN";
    return current;
}

// If node is normal "P(aragraph)": switch cases for the following situations    
let parseP = function(current, cursor) {
    // If currentent cursor is *: Either going to enter BOLD or ITALIC, 
        // we need to wait for next iteration
        // Regardless, we need to create a new node (stop adding context to this node)
        if (cursor == "*" || cursor == "_") {
            current.next = new Node();
            current = current.next;
            current.status = "AWAITASTERISK";
        } 
        
        // If currentent cursor is \n: Either remain in our currentent line or continue to a new line
        // determined by next iteration
        // Entering "AWAITRETURN" status
        else if (cursor == "\n") {
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        } 

        else if (cursor == "`") {
            current.next = new Node();
            current = current.next;
            current.status = "CODE";
        }

        else if (cursor == "~") {
            current.next = new Node();
            current = current.next;
            current.status = "AWAITTILDA";
        }

        else if (cursor == "<") {
            current.next = new Node();
            current = current.next;
            current.status = "HTMLSTART";
            current.context += cursor;
        }

        else if (cursor == "[") {
            current.next = new Node();
            current = current.next;
            current.status = "LINK";
        }
        
        // Else, we find out that it is just a normal character, append it;
        else {
            current.context += cursor;
        }
        return current;
}

let parseTRANSLATE = function(current, cursor) {
    if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.context += cursor;
        current.status = "P";
        current.next = new Node();
        current = current.next;
        current.status = "P";
    }
    
    return current;
}

let parseLINK = function(current, cursor) {
    switch(cursor) {
        case "]":
            current.config.src = "";
            break;
        case "(":
            if (current.config.src == undefined) {
                current.context += cursor;
            } else {
                current.config.src = "";
            }
            break;
        case ")":
            if (current.config.src == undefined) {
                current.context += cursor;
            } else {
                current.next = new Node();
                current = current.next;
            }
            break;
        default:
            if (current.config.src == undefined) {
                current.context += cursor;
            } else {
                current.config.src += cursor;
            }
    }

    return current;
}

let parseHTMLSTART = function(current, cursor) {
    if (cursor == ">") {
        current.context += cursor;
        let singleLabel = ['<br', '<hr', '<label', '<img', '<source'];
        let prohibitedDisplay = ['<script', '<style', '<link', '<meta'];
        if (prohibitedDisplay.map(x => current.context.indexOf(x) >= 0).reduce((p, c) => p || c)) {
            current.config.doRender = false;
            current.status = "HTML";
        }
        else if (singleLabel.map(x => current.context.indexOf(x) >= 0).reduce((p, c) => p || c)) {
            current.status = "HTML";
            current.config.doRender = true;
            current.next = new Node();
            current = current.next;
        } else {
            current.status = "HTML";
            current.config.doRender = true;
        }
    } else {
        current.context += cursor;
    }
    return current;
}

let parseHTML = function(current, cursor) {
    if (cursor == "<") {
        current.context += cursor;
        current.status = "ESCAPEHTML";
    } else {
        current.context += cursor;
    }

    return current;
}

let parseESCAPEHTML = function(current, cursor) {
    if (cursor == "/") {
        current.status = "HTMLEND";
        current.context += cursor;
    } else {
        current.context += cursor;
        current.status = "HTML";
    }
    return current;
}

let parseHTMLEND = function(current, cursor) {
    if (cursor == ">") {
        current.status = "HTML"
        current.context += cursor;
        current.next = new Node();
        current = current.next;
    } else {
        current.context += cursor;
    }

    return current;
}

let parseAWAITTILDA = function(current, cursor) {
    if (cursor == "~") {
        current.status = "STRIKETHROUGH";
    } else if (cursor == "*" || cursor == "_") {
        current.status = "UNDERLINEASTERISK";
    } else if (cursor == "\n") {
        current.status = "UNDERLINE";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.status = "UNDERLINE";
        current.context += cursor;
    }

    return current;
}

let parseUNDERLINEASTERISK = function(current, cursor, text) {
    if (cursor == "*" || cursor == "_") {
        cursor = text.fetchone();

        if (cursor == "*" || cursor == "_") {
            current.status = "UNDERLINEITALICBOLD";
        } 
        
        else if (cursor == undefined) {
            current.status = "UNDERLINEBOLD";
        } 
        
        else if (cursor == "\n") {
            current.status = "UNDERLINEBOLD";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        }

        else if (cursor == "~") {
            current.status = "UNDERLINE";
            current.next = new Node();
            current = current.next;
            current.status = "BOLD";
        }

        else {
            current.status = "UNDERLINEBOLD";
            current.context += cursor;
        }

    } 

    else if (cursor == "~") {
        current.status = "UNDERLINEITALIC";
        current.next = new Node();
        current = current.next;
        current.status = "ITALIC";
    }
    
    else if (cursor == "\n") {
        current.status = "UNDERLINEITALIC";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 
    
    else {
        current.status = "UNDERLINEITALIC";
        current.context += cursor;
    }

    return current;
}

let parseUNDERLINEITALIC = function(current, cursor, text) {
    if (cursor == "~") {
        current.next = new Node();
        current = current.next;
        current.status = "ITALIC";
    } else if (cursor == "*" || cursor == "_") {
        current.next = new Node();
        current = current.next;
        cursor = text.fetchone();
        if (cursor == "*" || cursor == "_") {
            current.status = "UNDERLINEITALICBOLD";
        } 
        
        else if (cursor == "\n") {
            current.status = "AWAITRETURN";
        } 
        
        else if (cursor == undefined) {
            return current;
        } 
        
        else {
            current.status = "UNDERLINE";
        }
    } else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.context += cursor;
    }

    return current;
}

let parseUNDERLINEITALICBOLD = function(current, cursor) {
    if (cursor == "*" || cursor == "_") {
        current.next = new Node();
        current = current.next;
        current.status = "UNDERLINEBOLD";
    } else if (cursor == "~") {
        current.next = new Node();
        current = current.next;
        current.status = "ITALICBOLD";
    } else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.context += cursor;
    }
    return current;
}

let parseUNDERLINEBOLD = function(current, cursor, text) {
    if (cursor == "*" || cursor == "_") {
        cursor = text.fetchone();

        if (cursor == "*" || cursor == "_") {
            current.next = new Node();
            current = current.next;
            current.status = "UNDERLINE";
        } 
        
        else if (cursor == undefined) {
            return current;
        } 
        
        else if (cursor == "~") {
            current.next = new Node();
            current = current.next;
            current.status = "ITALICBOLD";
        } 
        
        else if (cursor == "\n") {
            current.next = new Node();
            current = current.next;
            current.status = "AWAITASTERISK";
        } 
        
        else {
            current.next = new Node();
            current = current.next;
            current.status = "UNDERLINEITALICBOLD";
            current.context += cursor;
        }
    } 
    
    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 

    else if (cursor == "~") {
        current.next = new Node();
        current = current.next;
        current.status = "BOLD";
    }
    
    else {
        current.context += cursor;
    }
    return current;
}

let parseUNDERLINE = function(current, cursor) {
    if (cursor == "*" || cursor == "_") {
        current.next = new Node();
        current = current.next;
        current.status = "UNDERLINEASTERISK";
    } else if (cursor == "~") {
        current.next = new Node();
        current = current.next;
    } else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.context += cursor;
    }

    return current;
}

let parseSTRIKETHROUGH = function(current, cursor, text) {
    if (cursor == "~") {
        cursor = text.fetchone();
        if (cursor == "~") {
            current.next = new Node();
            current = current.next;
        } 
        
        else if (cursor == "\n") {
            current.next = new Node();
            current.context += "~";
            current = current.next;
            current.status = "AWAITRETURN";
        } 

        else if (cursor == undefined) {
            current.context += "~";
        }
        
        else {
            current.context += ("~" + cursor);
        }
    } 

    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    
    else {
        current.context += cursor;
    }
    return current;
}

// Awaiting for Asterisk:
let parseAWAITASTERISK = function(current, cursor) {
    // If currentent cursor is *: 
    // switch to BOLD status
    if (cursor == "*" || cursor == "_") {
        current.status = "P";
        current.next = new Node();
        current = current.next;
        current.status = "BOLD";
    }
    
    // If currentent cursor is '\n'
    // First terminate this line, and switch to AWAITRETURN mode
    else if (cursor == "\n") {
        current.status = "ITALIC";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 
    
    // If currentent cursor is SPACE:
    // then we need to enter a normal asterisk
    else if (cursor == " ") {
        current.status = "P";
        current.context += "* ";
    } 
    
    // Else: Other input values
    // append text to cursor
    else {
        current.status = "P";
        current.next = new Node();
        current = current.next;
        current.status = "ITALIC";
        current.context += cursor;
    }
    return current;
}

// Handling of Italic style:
let parseITALIC = function(current, cursor) {
    // If encountering *: break from Italic part
    if (cursor == "*" || cursor == "_") {
        current.status = "WITHINITALIC";
        // current.next = new Node();
        // current = current.next;
    } 

    // Else: If encountering a return: break from Italic part and create a new node
    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }

    // Else: Add currentent value to the context
    else {
        current.context += cursor;
    }

    return current;
}

let parseWITHINITALIC = function(current, cursor) {

    // If *_ ** __ _* encountered within ITALIC: ITALIC + BOLD mode
    if (cursor == "*" || cursor == "_") {
        current.status = "ITALICBOLD";
    } 

    // Else if \n encountered: ITALIC at end of a sentence
    // Hence, we need to switch to AWAITRETURN mode
    else if (cursor == "\n") {
        current.status = "ITALIC";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    
    // Else: Other characters encountered
    // Create new node with P, and add character to context
    else {
        current.status = "ITALIC";
        current.next = new Node();
        current = current.next;
        current.context += cursor;
    }

    return current;
}

let parseITALICBOLD = function(current, cursor) {

    // If Exit signal found: 
    // Since we are both parsing within ITALIC and BOLD, 
    // we could exit from ITALIC mode and continue to parse BOLD
    if (cursor == "*" || cursor == "_") {
        current.next = new Node();
        current = current.next;
        current.status = "BOLD";
    } 

    // Else if \n found:
    // Exit both ITALIC and BOLD,
    // And switch to awaitreturn mode
    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    
    // Else: 
    // Add new characters to the context
    else {
        current.context += cursor;
    }

    return current;
}

// Handling of BOLD style:
let parseBOLD = function(current, cursor) {
    // If encoutering a single *: 
    // Could be ITALICBOLD or EXITBOLD, we need to await another signal
    // Going to ESCAPEBOLD mode, awaiting for another * signal
    if (cursor == "*" || cursor == "_") {
        current.status = "ESCAPEBOLD";
    } 
    
    // Else if encountering a return: 
    // Going to AWAITRETURN mode, create a new node, breaking from currentent BOLD status
    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 
    
    // Else: 
    // Append currentent context to node
    else {
        current.context += cursor;
    }
    return current;
}

// Handling of ESCAPEBOLD mode:
let parseESCAPEBOLD = function(current, cursor) {

    // If encountering *:
    // Escape confirmed, create new node
    if (cursor == "*" || cursor == "_") {
        current.status = "BOLD";
        current.next = new Node();
        current = current.next;
    } 

    // Else if \n encountered: 
    // Not properly enclosed ITALIC style
    else if (cursor == "\n") {
        current.status = "ITALIC";
        current.context = "*" + current.context;
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    
    // Else: The following contents would be parsed as ITALICBOLD
    // Add current content to the new node
    else {
        current.status = "BOLD";
        current.next = new Node();
        current = current.next;
        current.status = "ITALICBOLD";
        current.context = cursor;
    }
    return current;
}

// Handling of AWAITRETURN mode:
let parseAWAITRETURN = function(current, cursor, text) {
    // If another return encountered:
    // start a new paragraph
    // And switch back to listen another return status
    if (cursor == "\n") {
        current.status = "RETURN";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 

    // Else: If an additional blank is encountered
    // Add this blank to context, just save them in case we need them
    else if (cursor == " ") {
        current.context += cursor;
        if (!current.config.indent) {
            current.config.indent = 0;
        }
        current.config.indent += 1;
    } 


    // Else: If # encountered: 
    // go to Header mode, parse Header
    else if (cursor == "#") {
        current.status = "HEADER";
        current.context = cursor;
    }
    
    // Else: if a * or a - encountered:
    // Switch to AWAITSPLIT mode
    else if (cursor == "*" || cursor == "-" || cursor == "_") {
        if (!current.config.indent) {
            current.config.indent = 0;
        }
        current.status = "AWAITSPLIT";
        current.context += cursor;
    }

    else if (cursor == '`') {
        current.status = "AWAITCODE";
        current.config.signallength = 1;
    }

    else if (cursor == "~") {
        current.status = "AWAITTILDA";
    }

    else if (cursor.match(/\d/)) {
        while (cursor != undefined) {
            if (cursor.match(/\d/)) {
                current.context += cursor;
                cursor = text.fetchone();
            } else {
                break;
            }
        }

        if (cursor == undefined) {
            current.status = "P";
        }

        else if (cursor == ".") {
            current.context += cursor;
            cursor = text.fetchone();
            if (cursor == " ") {                
                current.status = "OL";
                current.next = new Node();
                current = current.next;
            } 
            
            else if (cursor == "*") {
                current.status= "P";
                current.next = new Node();
                current = current.next;
                current.status = "AWAITASTERISK";
            } 
            
            else if (cursor == "`") {
                current.status = "P";
                current.next = new Node();
                current = current.next;
                current.status = "CODE"
            } 

            else if (cursor == "~") {
                current.status = "P";
                current.next = new Node();
                current = current.next;
                current.status = "AWAITTILDA";
            }
            
            else {
                current.status = "P";
                current.context += cursor;
            }
        } 
        
        else if (cursor == "\n") {
            current.status = "P";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        } 

        else if (cursor == "*" || cursor == "_") {
            current.status = "P";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITASTERISK";
        }

        else if (cursor == "`") {
            current.status = "P";
            current.next = new Node();
            current = current.next;
            current.status = "CODE";
        }

        else if (cursor == "~") {
            current.status = "P";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITTILDA";
        }
        
        else {
            current.status = "P";
            current.context += cursor;
        }
    }

    else if (cursor == ">") {
        current.status = "REFERENCE";
    }

    else if (cursor == "<") {
        current.context += cursor;
        current.status = "HTMLSTART";
    }

    else if (cursor == "!") {
        cursor = text.fetchone();
        if (cursor == undefined) {
            current.context += "!";
            current.status = "P";
        } else if (cursor == "\n") {
            current.status = "P";
            current.context += "!";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        } else if (cursor == "*" || cursor == "_") {
            current.status = "P";
            current.context += "!";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITASTERISK";
        } else if (cursor == "`") {
            current.status = "P";
            current.context += "!";
            current.next = new Node();
            current = current.next;
            current.status = "CODE";
        } else if (cursor == "<") {
            current.status = "P";
            current.context += "!";
            current.next = new Node();
            current = current.next;
            current.status = "HTMLSTART";
            current.context += cursor;
        } else if (cursor == "~") {
            current.status = "P";
            current.context += "!";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITTILDA";
        } else if (cursor != "[") {
            current.status = "P";
            current.context += ("!" + cursor);
        } else {
            current.status = "IMAGE";
            current.context = "";
        }
    }

    else if (cursor == "[") {
        current.status = "LINK";
        current.context = "";
    }

    // Else: 
    // this node is then used as a normal P node
    else {
        current.status = "P";
        current.context += cursor;
    }
    return current;
}

let parseIMAGE = function(current, cursor) {
    switch(cursor) {
        case "]":
        case "(":
            current.config.src = "";
            break;
        case ")":
            current.next = new Node();
            current = current.next;
            break;
        default:
            if (current.config.src == undefined) {
                current.context += cursor;
            } else {
                current.config.src += cursor;
            }
            break;
    }
    return current;
}

let parseREFERENCE = function(current, cursor) {
    if (cursor == "\n") {
        current.context = current.context.replace(/^\s*/, "");
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.context += cursor;
    }
    return current;
}

let parseAWAITCODE = function(current, cursor) {
    if (cursor == '`') {
        if (current.config.signallength >= 2) {
            current.status = "CODETYPE";
        } else {
            current.config.signallength += 1;
        }
    } else if (cursor == "\n") {
        current.status = "P";
        current.context = (current.config.signallength == 2)?('``'):("`");
    } else {
        if (current.config.signallength == 1) {
            current.status = "CODE";
            current.context = cursor;
        } else if (current.config.signallength == 2) {
            current.status = "CODE";
            current.context = "";
            current.next = new Node();
            current = current.next;
            
            if (cursor == "*" || cursor == "_") {
                current.status = "AWAITASTERISK";
            }

            else {
                current.status = "P";
                current.context += cursor;
            }
            
        }
        else {
            console.log("UNEXPECTED");
            current.status = "P";
        }
    }

    return current;
}

let parseCODETYPE = function(current, cursor) {
    if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "CODEBLOCK";
    } else {
        current.context += cursor;
    }
    return current;
}

let parseCODEBLOCK = function(current, cursor) {
    current.context += cursor;
    let exitsignal = current.context.indexOf("```");
    if (exitsignal >= 0) {
        current.context = current.context.replace("```", "");
        current.next = new Node();
        current = current.next;
    }
    return current;
}

let parseCODE = function(current, cursor) {
    if (cursor == "`") {
        current.next = new Node();
        current = current.next;
    } 
    
    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 
    
    else {
        current.context += cursor;
    }
    return current;
}

// Handling of AWAITSPLIT mode: 
// Try to create Split line symbols
// TODO: NOT YET FINISHED HERE
let parseAWAITSPLIT = function(current, cursor, text) {
    while (cursor == " " || cursor == "*" || cursor == "_" || cursor == "-") {
        current.context += cursor;
        cursor = text.fetchone();
    }

    let trimmed = current.context.replace(/^\s*/g, "");

    if (cursor == "\n") {
        if (trimmed.replace(/\s+/g, "").match(/^(\*|\_|\-){3,}/)) {
            current.status = "SPLIT";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        } else {
            let ul = trimmed.match(/^(\*|\-){1}\s+/)
            if (ul) {
                current.status = "UL";
                current.context = trimmed.substr(ul.index+ul.length);
            } else {
                current.status = "P";
            }
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        }
    } else {
        // Match for "     - 123"  and "     * 123"
        if (trimmed.match(/^(\*|\-){1}\s+$/))  {

            current.status = "UL";
            current.next = new Node();
            current = current.next;

            if (cursor == "`") {
                current.status = "CODE";
            } 

            else if (cursor == "[") {
                current.status = "LINK";
            }
            
            else {
                current.context = cursor;
            }
        } 
        
        else if (trimmed.match(/(\*|\-){1}\s+(\*|\-|\_){3}/)) {
            current.status = "UL";
            current.next = new Node();
            current = current.next;
            current.status = "ITALICBOLD";
            current.context = cursor;
        } else if (trimmed.match(/(\*|\-){1}\s+(\*|\-|\_){2}/)) {
            current.status = "UL";
            current.next = new Node();
            current = current.next;
            current.status = "BOLD";
            current.context = cursor;
        } else if (trimmed.match(/(\*|\-){1}\s+(\*|\_){1}/)) {
            current.status = "UL";
            current.next = new Node();
            current = current.next;
            current.status = "ITALIC";
            current.context = cursor;
        } else if (trimmed.match(/^(\*|\_){3}$/)) {
            current.status = "ITALICBOLD";
            current.context = cursor;
        } else if (trimmed.match(/^(\*|\_){2}$/)) {
            current.status = "BOLD";
            current.context = cursor;
        } else if (trimmed.match(/^(\*|\_){1}$/)) {
            current.status = "ITALIC";
            current.context = cursor;
        } else {
            if (cursor == "`") {
                current.status = "UL";
                current.next = new Node();
                current = current.next;
                current.status = "CODE";
            } 
            
            else if (cursor == "[") {
                current.status = "UL";
                current.next = new Node();
                current = current.next;
                current.status = "LINK";
            }
            
            else {
                current.status = "P";
                current.context += cursor;
            }
        }
    }

    return current;
}

let parseAWAITUL = function(current, cursor) {
    if (cursor == " ") {
        return current;
    } 
    
    else if (cursor == "-" || cursor == "*" || cursor == "_") {
        current.status = "AWAITSPLITLINE";
        current.config.sentence += cursor;
    }

    else if (cursor == "\n") {
        current.status = "UL";
        current.context = "";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }

    else if (cursor == "`") {
        current.status = "UL";
        current.context = "";
        current.next = new Node();
        current = current.next;
        current.status = "CODE";
    }

    else {
        current.status = "UL";
        current.context = cursor;
    }

    return current
}

let parseAWAITSPLITLINE = function(current, cursor) {
    if (cursor == " ") {
        current.config.sentence += cursor;
    }
    return undefined;
}

let parseUL = function(current, cursor) {
    if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } 
    
    else if (cursor == "*" || cursor == "_") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITASTERISK";
    }

    else if (cursor == "`") {
        current.next = new Node();
        current = current.next;
        current.status = "CODE";
    }
    
    else {
        current.context += cursor;
    }
    return current;
}

let parseULAWAITASTERISK = function(current, cursor) {
    if (cursor == "*" || cursor == "_") {
        current.status = "BOLD";
        current.context = current.context.substr(0, current.context.length-1);
    } 

    else if (cursor == "\n") {
        current.status = "UL";
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    
    else {
        current.status = "ITALIC";
        current.context = current.context.substr(0, current.context.length-1) + cursor;
    }
    return current;
}

let parseULBOLD = function(current, cursor) {
    if (cursor == "*" || cursor == "_") {
        current.status = "ULBOLDITALIC";
    }

    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }

    else {
        current.content += cursor;
    }

    return current;
}

let parseULITALIC = function(current, cursor) {
    if (cursor == "*" || cursor == "_") {
        current.status = "UL";
    } else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    } else {
        current.content += cursor;
    }

    return current;
}

let parseULBOLDITALIC = function(current, cursor) {
    if (cursor == "*" || cursor == "_") {
        current.next = new Node();
        current = current.next;
        current.status = "ULBOLD";
    } 
    else if (cursor == "\n") {
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    else {
        current.context += cursor;
    }
    return current;
}




/**
let parseAWAITSPLITPREV = function(current, cursor) {

    // If new space encountered: 
    // SPECIAL CASE: identifies between **BOLD** and * * BOLD * *, in which the second case is invalid
    if (cursor == " ") {
        current.context += cursor;
    }

    // if * or - encountered - then we need to add them to context
    else if (cursor == "*" || cursor == "-" || cursor == "_") { 
        current.context += cursor;
    } 
    
    // if Return encountered - then user intend to end this split line
    else if (cursor == "\n") {

        // if symbol length >= 3:
        // then we add a SPLIT line into our node. 
        if (current.context.trim().length >= 3) {
            current.status = "SPLIT";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN"
        }

        // Else: 
        // we treat them as normal Paragraphs
        else {
            current.status = "P";
            current.next = new Node();
            current = current.next;
            current.status = "AWAITRETURN";
        }
    }

    // if [ ] & [x] encountered: then maybe a checklist
    else if (cursor == "[") {
        // TODO: IMPLEMENT TODO HERE
        current.status = "AWAITTODO";
        current.context += cursor;
    }

    // Else - other characters inputted: 
    else {

        // trim leading spaces
        // let trimmed = current.context.replace(/^\s+/g, "");
        // console.log(trimmed);

        let status = "NEW";
        let innerText = new Text(current.context);
        let innerCursor = "";
        current.config.indent = 0;
        while (innerCursor != undefined) {

            innerCursor = innerText.fetchone();

            // On init:
            if (status == "NEW") {

                // Indentation
                if (innerCursor == " ") {
                    current.config.indent += 1;
                } 
                
                // If _ encountered:
                // Await another _ or * as BOLD, or await three of them as SPLIT
                else if (innerCursor == "_") {
                    status = "AWAITUNDER";
                } 

                // If - encountered: 
                // Await space as LIST, or await 
                else if (innerCursor == "-") {
                    status = "AWAITDASH";
                }

                else if (innerCursor == "*") {
                    status = "AWAITAST";
                }
                
                else {
                    console.log(`Unrecognizable symbol ${innerCursor} encountered`);
                }
            }
            
            else if (status == "AWAITUNDER") {
                
                if (innerCursor == " ") {
                    status = "AWAITSPLIT";
                } 
                
                else if (innerCursor == "-") {
                    status = "AWAITITALIC";
                }

                else if (innerCursor == "*" || innerCursor == "_") {
                    status = "AWAITBOLD";
                }

                else {
                    console.log(`Unrecognizable symbol ${innerCursor} encountered`);
                }
            }

            else if (status == "AWAITDASH") {
                if (innerCursor == " ") {
                    // NO MODIFICATION, POTENTIAL LIST
                } 
                
                else if (innerCursor == "-") {
                    status = "AWAITSPLIT";
                }
            }
        }



        // If a space is contained: Possible LIST
        if (trimmed.indexOf(" ") >= 0) {
            // If start with _: Invalid starting symbol, parse as P
            if (trimmed[0] == "_") {
                current.status = "P";
                current.context += cursor;
            } 
            // If start with - or *: try to parse as list
            else {
                let innerText = new Text(trimmed);
                let innerCursor = "";
                let state = "NEW";
                while (innerCursor != undefined) {
                    innerCursor = innerText.fetchone();
                    if (state == "NEW") {
                        if(innerCursor == "-" || innerCursor == "*") {
                            state = "AWAITLIST";
                        }
                    }

                    else if (state == "AWAITLIST") {
                        if (innerCursor == " ") {
                            // Continue and do not make update
                        } 
                        
                        else if (innerCursor == "*" || innerCursor == "_") {

                        }
                    }
                }
                
            }
        }

        // If we have a - in our context:
        // Possible combinations:
        // -**, *-*, **-
        // --*, -*-, *--
        // ---
        // *-, -*
        // --
        // **-: BOLD from -, we trim the first two asterisk and switch to BOLD
        // *-*: SPECIAL CASE: ITALIC for -, and then enter P mode, possible handling of `(CODE)
        // *--, *-: ITALIC from --, we trim the first asterisk and switch to ITALIC
        // TODO: ADD LIST SUPPORT
        // -**, -*: Entering LIST mode, and start BOLD & ITALIC mode
        // --*: SPECIAL CASE: normal for --, and start ITALIC mode
        //  ---: regular Paragraph
        // TODO: HANDLING OF *-* WITH CODE
        else if (trimmed.indexOf("-") >= 0) {
            // Matching for **-
            if (trimmed.match(/^(\*|\_)(\*|\_)\-/)) {
                current.status = "BOLD";
                current.context = current.context.substr(2) + cursor;
            } 
            
            // Matching for *-*
            else if (trimmed.match(/^(\*|\_)\-(\*|\_)/)) {
                current.status = "ITALIC";
                current.context = "-";
                current.next = new Node();
                current = current.next;
                current.context += cursor;
            } 
            
            // Matching for *--
            else if (trimmed.match(/^(\*|\_)\-\-/)) {
                current.status = "ITALIC";
                current.context = current.context.substr(1) + cursor;
            } 
            
            // Else: --*, 
            else {
                current.status = "P";
            }
        }

        // ELSE: if we encounter * or _: we need to consider either BOLD or ITALIC
        // We already know that there isnt any * in our symbols
        else if (trimmed.length == 3) {
            current.status = "ITALICBOLD";
            current.context = current.context.substr(3) + cursor;
        }
        
        // Double symbol: BOLD, we do not consider *_ or _* as valid symbols
        // Current node: DO NOT RENDER, but do not remove them just in case
        else if (trimmed.length == 2) {
            current.status = "BOLD";
            current.context = current.context.substr(2) + cursor;
        } 

        // single symbol: ITALIC
        // Current node: DO NOT RENDER, but do not remove them just in case
        else if (trimmed.length == 1) {
            current.status = "ITALIC";
            current.context = current.context.substr(1) + cursor;
        } 
        
        // Invalid symbol encountered, treat as normal Paragraph node
        else {
            current.status = "P";
            current.context += cursor;
        }
    }
    return current;
}

*/

// TODO: FINISH THIS
let parseAWAITTODO = function(current, cursor) {
    if (cursor == "x") {
        current.config.finish = true;
    } else if (cursor == " ") {
        // Continue without modification
    } else if (cursor == "]") {
        current.status = "TODO";
    } else {
        current.status = "P"
    }
    return current;
}

// Handling of HEADER mode
let parseHEADER = function(current, cursor, text) {
    if (cursor == "#") {
        current.context += cursor;
    } else if (cursor == " ") {
        // Continue and do not make changes until a character is encountered;
    }
    else {
        current.config.header = current.context.trim().length;
        current.context = "";
        while (cursor != "\n" && cursor != undefined) {
            current.context += cursor;
            cursor = text.fetchone();
        }
        current.next = new Node();
        current = current.next;
        current.status = "AWAITRETURN";
    }
    return current;
}

let parseSingle = function(current, cursor, text) {
    let prevStatus = current.status;
    // let command = `current = parse${prevStatus}(current, cursor, text)`
    // console.log(current.printNode());
    // console.log("--------");
    // console.log(`${command}:${cursor}`);
    // console.log(current);
    switch(current.status) {
        case "NEW":
            current = parseNEW(current);
            break;
        case "P":
            current = parseP(current, cursor);
            break;
        case "TRANSLATE":
            current = parseTRANSLATE(current, cursor);
            break;
        case "LINK":
            current = parseLINK(current, cursor);
            break;
        case "HTMLSTART":
            current = parseHTMLSTART(current, cursor);
            break;
        case "HTML":
            current = parseHTML(current, cursor);
            break;
        case "ESCAPEHTML":
            current = parseESCAPEHTML(current, cursor);
            break;
        case "HTMLEND":
            current = parseHTMLEND(current, cursor);
            break;
        case "AWAITTILDA":
            current = parseAWAITTILDA(current, cursor);
            break;
        case "UNDERLINEASTERISK":
            current = parseUNDERLINEASTERISK(current, cursor, text);
            break;
        case "UNDERLINEITALIC":
            current = parseUNDERLINEITALIC(current, cursor, text);
            break;
        case "UNDERLINEITALICBOLD":
            current = parseUNDERLINEITALICBOLD(current, cursor);
            break;
        case "UNDERLINEBOLD":
            current = parseUNDERLINEBOLD(current, cursor, text);
            break;
        case "UNDERLINE":
            current = parseUNDERLINE(current, cursor);
            break;
        case "STRIKETHROUGH":
            current = parseSTRIKETHROUGH(current, cursor, text);
            break;
        case "AWAITASTERISK":
            current = parseAWAITASTERISK(current, cursor);
            break;
        case "ITALIC":
            current = parseITALIC(current, cursor);
            break;
        case "WITHINITALIC":
            current = parseWITHINITALIC(current, cursor);
            break;
        case "ITALICBOLD":
            current = parseITALICBOLD(current, cursor);
            break;
        case "BOLD":
            current = parseBOLD(current, cursor);
            break;
        case "ESCAPEBOLD":
            current = parseESCAPEBOLD(current, cursor);
            break;
        case "AWAITRETURN":
            current = parseAWAITRETURN(current, cursor, text);
            break;
        case 'IMAGE':
            current = parseIMAGE(current, cursor);
            break;
        case "REFERENCE":
            current = parseREFERENCE(current, cursor);
            break;
        case "AWAITCODE":
            current = parseAWAITCODE(current, cursor);
            break;
        case "CODETYPE":
            current = parseCODETYPE(current, cursor);
            break;
        case "CODEBLOCK":
            current = parseCODEBLOCK(current, cursor);
            break;
        case "CODE":
            current = parseCODE(current, cursor);
            break;
        case "AWAITSPLIT":
            current = parseAWAITSPLIT(current, cursor, text);
            break;
        case "AWAITUL":
            current = parseAWAITUL(current, cursor);
            break;
        case "AWAITSPLITLINE":
            current = parseAWAITSPLITLINE(current, cursor);
            break;
        case "UL":
            current = parseUL(current, cursor);
            break;
        case "ULAWAITASTERISK":
            current = parseULAWAITASTERISK(current, cursor);
            break;
        case "ULBOLD":
            current = parseULBOLD(current, cursor);
            break;
        case "ULITALIC":
            current = parseULITALIC(current, cursor);
            break;
        case "ULBOLDITALIC":
            current = parseULBOLDITALIC(current, cursor);
            break;
        case "AWAITTODO":
            current = parseAWAITTODO(current, cursor);
            break;
        case "HEADER":
            current = parseHEADER(current, cursor, text);
            break;
        default:
            console.log(`Status ${current.status} not caught.`);
            current = undefined;
    }

    if (current == undefined) {
        console.log(`Error at  State ${prevStatus}`);
    }
    return current;
}


export default Parser;