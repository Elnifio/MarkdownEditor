let Parser = require("./MarkdownCompiler/parser");
let Displayer = require("./MarkdownCompiler/ASTDisplay");
let Differ = require("./MarkdownCompiler/ASTDiffer");
let fs = require("fs");

let tfile = fs.readFileSync("./MarkdownCompiler/test.md").toString();
let psr = new Parser.Parser();
let disp = new Displayer.Displayer();
let differ = new Differ.Differ();

disp.visit(psr.parse(tfile));

