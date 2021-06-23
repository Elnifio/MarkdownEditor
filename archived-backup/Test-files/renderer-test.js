// 测试用：读取test.md作为初始值
let fs = require("fs");
let docu = fs.readFileSync("./MarkdownCompiler/test.md").toString();

// 测试JavaScript原生写的renderer
// let Renderer = require("./MarkdownCompiler/Renderer");
// let ren = new Renderer.Renderer();
// let parsed = ren.render(docu);

// Markdown Parser模块
let Parser = require("../MarkdownCompiler/parser");
// 构建parser对象
let psr = new Parser.Parser();
// 解析读取的文档
let ast = psr.parse(docu);

// 非必需：AST模块
let AST = require("../MarkdownCompiler/AST");
// 要么把这个放在这里要么把这个放在html里面 不然不会eval
let Components = require("../MarkdownCompiler/Components");
let HomepageComponents = require("../HomepageComponent");

// 这一部分是之前用于测试的代码
/**
 * 之前用于测试的代码
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
 */

document.getElementById("txt").innerHTML = docu;

// Vue写的Renderer
let vm = new Vue({
    el: "#app",
    data: {
        ast: ast
    },
    methods: {
        reparse: function(event) {
            this.ast = psr.parse(event.target.value);
        }
    }
})

// let vm = new Vue({
//     el: "#app",
//     data: {
//         default: docu
//     },
//     methods: {
//         reparse: function(text) {
//             return psr.parse(text);
//         }
//     }
// })



