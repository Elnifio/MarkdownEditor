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

let ASTTester = function() {
    let AST = require("./AST");
    let Visitor = require("./ASTDisplay");
    let ast = new AST.MD();
    let b = new AST.Paragraph();
    ast.addBlock(b);
    b.addSentence("first sentence");
    b.addSentence("second sentence");
    let c = new AST.Paragraph();
    ast.addBlock(c);
    c.addSentence("first in C");
    c.addSentence("second in C");
    ast.addBlock(new AST.Separator());
    ast.addBlock(new AST.Paragraph());

    let v = new Visitor.Displayer();
    v.visit(ast);
}

ASTTester();