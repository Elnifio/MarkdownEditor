let Lexer = require("./CalcLang/lexer");
let lex = new Lexer.Lexer();
let Parser = require("./CalcLang/parser");
let parser = new Parser.Parser();
let Displayer = require("./CalcLang/ASTDisplay");
let disp = new Displayer.Displayer();

let LexAll = function(inp) {
    let out = [];
    lex.init(inp);
    let curr = lex.yield();
    out.push(curr);
    while (curr.type != Lexer.TokenType.eof) {
        curr = lex.yield();
        out.push(curr);
    }

    out.forEach(x => console.log(x.toString()));
}

let prog = `
    { a: 1, b: {a: 1, b: 2, c: 3}, c: 3, d: fn(x, y=3) { y=x+3; }};
    testfn01 = fn() {a = 1;};
    testfn02 = fn(x) { b = 2;};
    testfn03 = fn(x=1) { c = 3;};
    testfn04 = fn(x, y=3) {d.e.f.g = 4;};
    testfn04(a);
    testfn04(b);
    testfn04(c, d);
    testfn04(testfn05(), testfn01());
    # fail05 = fn(x=3, y) { e = f; };
`

let res = parser.parse(prog);

disp.display(res);

// parser.parse(prog);
// let ast = require("./CalcLang/AST");