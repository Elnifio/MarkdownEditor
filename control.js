import Parser from "./MarkdownAnalyzer/parser.js";
import Renderer from "./MarkdownAnalyzer/renderer.js";

let Controller = function(view, text="") {
    this.view = view;
    this.parser = new Parser(text);
    this.renderer = new Renderer(this.parser);

    this.updateView = function(inputText) {
        // console.log(`updating from Controller with text ${inputText}`);
        let start = new Date();
        this.parser = new Parser(inputText);
        this.parser.parse();
        this.renderer = new Renderer(this.parser);
        this.view.update(this.renderer.render());
        let end = new Date();
        console.log(`Time elapsed for parsing and rendering: ${end - start} ms`);
    }

    console.log("Init Controller Success");
}


export default Controller;
