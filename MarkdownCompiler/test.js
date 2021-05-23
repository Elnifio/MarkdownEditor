// import Lexer from "./lexer.js";
let LexerTester = function() {
    let Lexer = require("./lexer");
    
    let word = ["#### this is a header", "", "and this should be a new paragraph", 
    "**with bold here** and *italic here* and ___bold italic here___", 
    "and ~underline~ and ~~strikethrough~~ and ~~~underline strikethrough~~~", 
    "with [link](link) here", "", "![image](image here)"];
    
    let testtext = "";
    let item;
    for (item in word) {
        testtext += (word[item] + "\n");
    }
    
    console.log(testtext);
    let lexer = new Lexer.Lexer();
    lexer.init(testtext);
    // console.log(lexer);
    
    let nexter = lexer.yield();
    console.log(nexter);
    
    nexter = lexer.yield();
    console.log(nexter);
    
    while (nexter) {
        nexter = lexer.yield();
        console.log(nexter);
    }
}
// LexerTester();

// tests the AST constructor
let ASTTester = function() {
    let AST = require("./AST");
    let Visitor = require("./ASTDisplay");

    let ast = new AST.MD();

    let b = new AST.Paragraph();
    ast.addBlock(b);

    let sen1 = new AST.Sentence();
    sen1.set("This is the first sentence. ");
    b.addSentence(sen1);

    let sen2 = new AST.Sentence();
    sen2.set("This is the second sentence. ");
    sen2.setStyle("bold", true);
    b.addSentence(sen2);
    
    let c = new AST.Paragraph();
    ast.addBlock(c);
    ast.addBlock(new AST.Separator());
    ast.addBlock(new AST.Paragraph());

    let v = new Visitor.Displayer();
    v.visit(ast);
}

// ASTTester();

let parserTester01 = function() {
    let Parser = require("./parser");
    let Displayer = require("./ASTDisplay");
    let disp = new Displayer.Displayer();
    let texts = ["this is a sentence **and this is a bold sentence**", 
    "*and this is a italic sentence* and",
    "and $latex$$latex2$ and empty inline latex $$ and end", "and end",
    "", "- this is first list item;", " - this is a sublist item"];
    let text = texts.join("\n");

    let ps = new Parser.Parser();
    let ast = ps.parse(text);
    disp.visit(ast);
}

parserTester01();

