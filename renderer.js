let fs = require("fs");

let docu = fs.readFileSync("./MarkdownCompiler/test.md").toString();

// let Renderer = require("./MarkdownCompiler/Renderer");
// let ren = new Renderer.Renderer();
// let parsed = ren.render(docu);

let Parser = require("./MarkdownCompiler/parser");
let psr = new Parser.Parser();
let ast = psr.parse(docu);

let AST = require("./MarkdownCompiler/AST");
let Components = require("./MarkdownCompiler/Components");

// let sen = new AST.Sentence();
// sen.style.bold = true;
// sen.style.italic = true;
// sen.set("123456");

// let sen2 = new AST.Sentence();
// sen2.set("789012");
// sen2.style.code = true;
// sen2.style.underline = true;

// let lin1 = new AST.Link();
// lin1.set("url", "https://google.com");
// lin1.set("alt", "google.com");

// let para = new AST.Paragraph();
// para.addSentence(sen);
// para.addSentence(sen2);
// para.addSentence(lin1);

let vm = new Vue({
    el: "#app",
    data: {
        ast: ast
    },
    methods: {
        reparse: function(event) {
            console.log(event.target.value);
            this.ast = psr.parse(event.target.value);
        }
    }
})




