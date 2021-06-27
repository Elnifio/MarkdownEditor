// requires katex for latex support

const katex = require("katex");

// --------
// ENUMERATIONS OF AST NODES
let ASTType = {
    // General Purpose AST Abstract Type
    AST: "ast",

    // Markdown Top-level Type
    MD: "markdown-block",

    // Block-level Types
    Block: "block",
    Paragraph: "paragraph",
    Separator: "separator",
    CodeBlock: "code-block",
    LatexBlock: "latex-block",
    Image: "image-block",
    UL: "unordered-list-block",
    OL: "ordered-list-block",
    TODO: "todo-block",
    TODOList: "todo-list",
    Reference: "reference-block",
    Header: "header-block",
    ListItem: "list-item-block",
    ReferenceSeparator: "reference-separator",

    // Sentence-level element
    Sentence: "sentence",
    Latex: "inline-latex",
    Link: "inline-link",

    // Other elements
    Others: "others",
}
Object.freeze(ASTType);
exports.ASTTypes = ASTType;

// --------
// ENUMERATIONS OF SENTENCE STYLES
let Style = {
    bold: "Bold",
    italic: "Italic",
    strikethrough: "Strike Through",
    underline: "Underline",
    code: "Code"
}
Object.freeze(Style);
exports.Style = Style;

let InteractIndex = function(start, end)  {
    this.start = start;
    this.end = end;
}
exports.InteractIndex = InteractIndex;

// --------
// GENERAL AST ABSTRACT CLASS
// --------
// General AST Parents
let AST = function(type=ASTType.AST) {
    this.type = type;
    this.line = -1;
    this.report = function(indent="") {
        console.log(`${indent}Type: ${this.type}: ${this.toString()}`);
    }
    this.toString = function() { return `${this.type}@line ${this.line}`; }

    this.visit = function(visitor, args) {
        throw `visiting abstract AST Node with type ${this.type}`;
    }
}

// --------
// 
// MARKDOWN CONTAINER
//      Concrete Tree Node
// --------
let MD = function() {
    // Markdown Top block
    // inherit from AST
    // export module.MD() constructor
    this.blocks = [];
    this.addBlock = function(block) { this.blocks.push(block); };

    this.visit = function(visitor, args) { return visitor.visitMD(this, args); }
}
MD.prototype = new AST(ASTType.MD);
exports.MD = MD;

// --------
// BLOCK-LEVEL ITEMS
//      Block
//      Paragraph
//      Separator
//      CodeBlock
//      LaTeXBlock
//      Image
//      UL & OL & TODO
//      Reference
//      Header
// --------
// Abstract Tree Node
let Block = function(type=ASTType.Block) {
    // Block constructor
    // should not be explicitly used
    // do not export it
    this.type = type;
}
Block.prototype = new AST(ASTType.Block);

// Paragraph block
// Concrete Tree Node
let Paragraph = function() {
    this.sentences = [];
    this.addSentence = function(sentence) {
        this.sentences.push(sentence);
    };

    this.visit = function(visitor, args)  { return visitor.visitParagraph(this, args); }
};
Paragraph.prototype = new Block(ASTType.Paragraph);
exports.Paragraph = Paragraph;

// Single Sentence Reference Container
let Reference = function() {
    this.sentences = [];
    this.addSentence = function(ctt) { this.sentences.push(ctt); }
    this.get = function() { return this.sentences; }
    this.visit = function(visitor, arg)  { return visitor.visitReference(this, arg); }
}
Reference.prototype = new Block(ASTType.Reference);
exports.Reference = Reference;

let ListItem = function() {
    this.sentences = [];
    this.addSentence = function(sentence) {
        this.sentences.push(sentence);
    };
    this.visit = function(visitor, args) { return visitor.visitListItem(this, args); }
}
ListItem.prototype = new Block(ASTType.ListItem);
exports.ListItem = ListItem;

// \TODO block
let TODOBlock = function(idx) {
    this.sentences = [];
    this.status = false;
    this.level = 0;
    this.addSentence = function(sentence) {
        this.sentences.push(sentence);
    }
    this.todoIndex = idx;
    this.indent = -1;
    this.subActions = [];
    this.addAction = function(todo) {
        this.subActions.push(todo);
        todo.level += 1;
    }
    this.getAction = function() {
        return this.subActions;
    }
    this.hasAction = function() { return this.subActions.length != 0; }
    this.visit = function(visitor, arg) { return visitor.visitTODO(this, arg); }
}
TODOBlock.prototype = new Block(ASTType.TODO);
exports.TODO = TODOBlock;

// Separator block
let Separator = function() { 
    this.visit = function(visitor, args) { return visitor.visitSeparator(this, args); }
};
Separator.prototype = new Block(ASTType.Separator);
exports.Separator = Separator;

let ContentableBlock = function(type=ASTType.Block) {
    this.content = "";
    this.type = type;
    this.set = function(content) { this.content = content; }
    this.get = function() { return this.content; }
}
ContentableBlock.prototype = new Block(ASTType.Others);

// CodeBlock block
let CodeBlock = function() { 
    this.codetype = undefined;
    this.setType = function(content) { this.codetype = content; }
    this.getType = function() { return this.codetype; }
    this.visit = function(visitor, arg)  { return visitor.visitCodeBlock(this, arg); }
    this.activated=false;
}
CodeBlock.prototype = new ContentableBlock(ASTType.CodeBlock);
exports.CodeBlock = CodeBlock;

// LaTeX block
let LatexBlock = function() {
    this.visit = function(visitor, arg)  { return visitor.visitLatexBlock(this, arg); }
    this.render = function() {
        return katex.renderToString(this.content, {throwOnError:false});
    }

}
LatexBlock.prototype = new ContentableBlock(ASTType.LatexBlock);
exports.LatexBlock = LatexBlock;

// Image block
let ImageBlock = function() {
    this.property = {
        alt: "",
        src: "",
    }
    this.set = function(option, value) {
        if (this.property[option] != undefined) this.property[option] = value;
    }
    this.get = function(option) { return this.property[option]; }

    this.visit = function(visitor, arg) { return visitor.visitImage(this, arg); }
}
ImageBlock.prototype = new Block(ASTType.Image);
exports.Image = ImageBlock;

// General List block
let ListBlock = function(type=ASTType.List) {
    this.type = type;
    this.indent = -1;
}
ListBlock.prototype = new Block(ASTType.Others);

// unordered list block
let ULBlock = function() {
    this.subBlocks = [];
    this.insertBlock = function(block) {
        this.subBlocks.push(block);
    }
    this.getBlock = function() { return this.subBlocks; }
    this.visit = function(visitor, arg) { return visitor.visitUL(this, arg); }
}
ULBlock.prototype = new ListBlock(ASTType.UL);
exports.UL = ULBlock;

// ordered list block
let OLBlock = function() {
    this.subBlocks = [];
    this.insertBlock = function(block) {
        this.subBlocks.push(block);
    }
    this.getBlock = function() { return this.subBlocks; }
    this.visit = function(visitor, arg) { return visitor.visitOL(this, arg); }
}
OLBlock.prototype = new ListBlock(ASTType.OL);
exports.OL = OLBlock;

let TODOList = function(idx) {
    this.subBlocks = [];
    this.insertBlock = function(block) {
        this.subBlocks.push(block);
    }
    this.getBlock = function() {
        return this.subBlocks;
    }

    this.visit = function(visitor, arg) { return visitor.visitTODOList(this, arg); }
}
TODOList.prototype = new ListBlock(ASTType.TODOList);
exports.TODOList = TODOList;

let Header = function() {
    this.level=0;
    this.visit = function(visitor, arg) { return visitor.visitHeader(this, arg); }
}
Header.prototype = new ContentableBlock(ASTType.Header);
exports.Header = Header;

// --------
// SENTENCE LEVEL ITEMS
//      Sentence
//      Latex
//      Link
// --------
let MetaSentence = function(type=ASTType.Others) {
    this.content = "";
    this.type = type;
    this.set = function(ctt) { this.content = ctt; }
    this.get = function() {return this.content; }
}
MetaSentence.prototype = new AST(ASTType.Others);

let ReferenceSeparator = function() {
    this.visit = function(visitor, arg) { return visitor.visitReferenceSeparator(this, arg); }
}
ReferenceSeparator.prototype = new MetaSentence(ASTType.ReferenceSeparator);
exports.RefSeparator = ReferenceSeparator;

let StyleConstructor = function() {
    this.bold = false;
    this.italic=false;
    this.underline=false;
    this.strikethrough=false;
    this.code=false;

    this.compress = function() {
        return {
            'font-weight-bold': this.bold,
            'font-italic': this.italic,
            'text-decoration-underline': this.underline,
            'text-decoration-line-through': this.strikethrough,
        }
    };

    this.toObject = function() {
        let out = [];
        let key;
        for (key in Style) {
            if (this[key]) out.push(key);
        }
        return out;
    }

    this.toString = function() {
        if (this.bold || this.italic || this.underline || this.strikethrough || this.code) {
            let properties = [];
            if (this.bold) properties.push('Bold');
            if (this.italic) properties.push("Italic");
            if (this.underline) properties.push("Underline");
            if (this.strikethrough) properties.push("Strikethrough");
            if (this.code) properties.push("Code");
            return properties.reduce((accumulator, current) => accumulator + " " + current);
        } else {
            return "";
        }
    }
}
exports.StyleConstructor = StyleConstructor;

let Sentence = function() {
    this.style = new StyleConstructor();

    this.setStyle = function(option, value=false) {
        if (this.style[option] != undefined) {
            this.style[option] = value;
        }
    }

    this.isCode = function() { return this.style.code; }

    this.getStyle = function() { return this.style.compress(); }
    this.visit = function(visitor, arg) { return visitor.visitSentence(this, arg); }
}
Sentence.prototype = new MetaSentence(ASTType.Sentence);
exports.Sentence = Sentence;

let InlineLatex = function() {
    this.visit = function(visitor, arg) { return visitor.visitInlineLatex(this, arg); }
    this.render = function() {
        return katex.renderToString(this.content, {throwOnError:false});
    }
}
InlineLatex.prototype = new MetaSentence(ASTType.Latex);
exports.InlineLatex = InlineLatex;

let Link = function() {
    this.property = {
        url: "",
        alt: "",
    }

    this.set = function(option, value) {
        if (this.property[option] != undefined) this.property[option] = value; 
    }
    this.get = function(option) { return this.property[option]; }

    this.visit = function(visitor, arg) { return visitor.visitLink(this, arg); }
}
Link.prototype = new MetaSentence(ASTType.Link);
exports.Link = Link;