// --------
// ENUMERATIONS OF AST NODES

const { TouchBarSlider } = require("electron");

// --------
let ASTType = {
    // General Purpose AST Abstract Type
    AST: "AST",

    // Markdown Top-level Type
    MD: "Markdown",

    // Block-level Types
    Block: "Block",
    Paragraph: "Paragraph",
    Separator: "Separator",
    CodeBlock: "Code Block",
    LatexBlock: "LaTeX Block",
    Image: "Image",
    UL: "Unordered List",
    OL: "Ordered List",
    TODO: "Todo List",
    Reference: "Reference Block",
    Header: "Header",

    // Sentence-level element
    Sentence: "Sentence",
    Latex: "Inline Latex",
    Link: "Link",

    Others: "Others",
}
Object.freeze(ASTType);
exports.ASTTypes = ASTType;

let Style = {
    bold: "Bold",
    italic: "Italic",
    strikethrough: "Strike Through",
    underline: "Underline"
}
Object.freeze(Style);
exports.Style = Style;

// --------
// GENERAL AST ABSTRACT CLASS
// --------
// General AST Parents
let AST = function(type=ASTType.AST) {
    this.type = type;
    this.report = function(indent="") {
        console.log(`${indent}Type: ${this.type}: ${this.toString()}`);
    }
    this.toString = function() { return this.type; }

    this.visit = function(visitor, args) {
        throw `visiting abstract AST Node with type ${this.type}`;
    }
}

// --------
// MARKDOWN CONTAINER
// --------
// Markdown Top block
// inherit from AST
// export module.MD() constructor
let MD = function() {
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
// Block constructor
// should not be explicitly used
// do not export it
let Block = function(type=ASTType.Block) {
    this.type = type;
}
Block.prototype = new AST(ASTType.Block);

// Paragraph block
let Paragraph = function() {
    this.sentences = [];
    this.addSentence = function(sentence) {
        this.sentences.push(sentence);
    };

    this.visit = function(visitor, args)  { return visitor.visitParagraph(this, args); }
};
Paragraph.prototype = new Block(ASTType.Paragraph);
exports.Paragraph = Paragraph;

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
    this.codetype = "untyped";
    this.setType = function(content) { this.codetype = content; }
    this.getType = function() { return this.codetype; }
    this.visit = function(visitor, arg)  { visitor.visitCodeBlock(this, arg); }
}
CodeBlock.prototype = new ContentableBlock(ASTType.CodeBlock);
exports.CodeBlock = CodeBlock;

// LaTeX block
let LatexBlock = function() {
    this.visit = function(visitor, arg)  { visitor.visitLatexBlock(this, arg); }
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

    this.visit = function(visitor, arg) { visitor.visitImage(this, arg); }
}
ImageBlock.prototype = new Block(ASTType.Image);
exports.Image = ImageBlock;

// General List block
let ListBlock = function(type=ASTType.List) {
    this.type = type;
    this.subBlocks = [];
    this.insertBlock = function(block) {
        this.subBlocks.push(block);
    }
    this.getBlock = function() { return this.subBlocks; }
}
ListBlock.prototype = new Block(ASTType.Others);

// unordered list block
let ULBlock = function() {
    this.visit = function(visitor, arg) { visitor.visitUL(this, arg); }
}
ULBlock.prototype = new ListBlock(ASTType.UL);
exports.UL = ULBlock;

// ordered list block
let OLBlock = function() {
    this.visit = function(visitor, arg) { visitor.visitOL(this, arg); }
}
OLBlock.prototype = new ListBlock(ASTType.OL);
exports.OL = OLBlock;

// \TODO block
let TODOBlock = function() {
    this.insertBlock = function(block, status) {
        this.subBlocks.push({block, status});
    }
    this.visit = function(visitor, arg) { visitor.visitTODO(this, arg); }
}
TODOBlock.prototype = new ListBlock(ASTType.TODO);
exports.TODO = TODOBlock;

// Reference Block
let Reference = function() {
    this.content = new Sentence();
    this.set = function(ctt) { this.content = ctt; }
    this.get = function() { return this.content; }
    this.visit = function(visitor, arg)  { visitor.visitReference(this, arg); }
}
Reference.prototype = new Block(ASTType.Reference);
exports.Reference = Reference;

let Header = function() {
    this.visit = function(visitor, arg) { visitor.visitHeader(this. arg); }
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

let Sentence = function() {
    this.style = {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        code: false,

        toString: function() {
            return (this.bold || this.italic || this.underline || this.strikethrough || this.code)?
            `${this.bold?"Bold ":""}${this.italic?"Italic ":""}` + 
            `${this.underline?"Underline ":""}${this.strikethrough?"Strikethrough ":""}` + 
            `${this.code?"Code":""};`:"Plain;";
        }
    }

    this.setStyle = function(option, value=false) {
        if (this.style[option] != undefined) {
            this.style[option] = value;
        }
    }

    this.getStyle = function(option) { return this.style[option]; }
    this.visit = function(visitor, arg) { visitor.visitSentence(this, arg); }
}
Sentence.prototype = new MetaSentence(ASTType.Sentence);
exports.Sentence = Sentence;

let InlineLatex = function() {
    this.visit = function(visitor, arg) { visitor.visitInlineLatex(this, arg); }
}
InlineLatex.prototype = new MetaSentence(ASTType.Latex);
exports.InlineLatex = InlineLatex;

let Link = function() {
    this.property = {
        url: "",
        alt: new Sentence(),
    }

    this.set = function(option, value) {
        if (this.property[option] != undefined) this.property[option] = value; 
    }
    this.get = function(option) { return this.property[option]; }

    this.visit = function(visitor, arg) { visitor.visitLink(this, arg); }
}
Link.prototype = new MetaSentence(ASTType.Link);
exports.Link = Link;