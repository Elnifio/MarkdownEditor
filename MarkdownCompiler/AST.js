// --------
// ENUMERATIONS OF AST NODES
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
}
Object.freeze(ASTType);
exports.Types = ASTType;

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

let Separator = function() { 
    this.visit = function(visitor, args) { return visitor.visitSeparator(this, args); }
};
Separator.prototype = new Block(ASTType.Separator);
exports.Separator = Separator;


// --------
// SENTENCE LEVEL ITEMS
//      Sentence
//      Latex
//      Link
// --------