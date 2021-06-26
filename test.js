let fs = require("fs");
let p = require("./MarkdownCompiler/parser");
let z = require("./MarkdownCompiler/ASTZipper");
let d = require("./MarkdownCompiler/ASTDisplay");

let psr = new p.Parser();
let zpr = new z.ASTZipper();
let disp = new d.Displayer();

let tfile = fs.readFileSync("./test.md").toString();
disp.visit(psr.parse(tfile));

console.log("--------");
disp.visit(z.ASTUnzipper(zpr.zip(psr.parse(tfile))));