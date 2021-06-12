// import Parser from '../MarkdownAnalyzer/parser.js';
// import Renderer from '../MarkdownAnalyzer/renderer.js';

/**
 *  An object that manipulates with editor & loader
 *  
 *  interface to Controller: 
 *      updateText(text) -> function(editor, display)   
 *          genericController updates this, this pass updated value to parser, 
 *          gets back the rendered context, and wrap it as a function to append to components
 */


let EditorController = function() {
    this.parser = undefined;
    this.renderer = undefined;

    this.listener = undefined;
    this.listenAvaibale = function() { return this.listener != undefined && this.listener != null; };
    this.registerListener = function(listener) { this.listener = listener; }

    this.updateText = function(text) {
        // this.parser = new Parser(text);
        // this.parser.parse();
        // this.renderer = new Renderer(this.parser);
        // let result = this.renderer.render();
        return (editor, display) => {
            // editor remains the same
            editor.value = text;
            // display content should be updated
            display.innerHTML = text;
        }
    }
}

export default EditorController;