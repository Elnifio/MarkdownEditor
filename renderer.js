let fs = require("fs");

let docu = fs.readFileSync("./MarkdownCompiler/test.md").toString();

let Renderer = require("./MarkdownCompiler/Renderer");
let ren = new Renderer.Renderer();
let parsed = ren.render(docu);

document.getElementById("app").append(parsed);
