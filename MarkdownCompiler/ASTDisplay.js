let show = function(prefix, content) {
    console.log(prefix + content);
}

let Displayer = function(defaultprefix="") {
    this.visitMD = function(ast, args) {
        show(args, ast.toString() + `: Block[${ast.blocks.length}]`);
        let prefix = args + " | ";
        ast.blocks.forEach((x) => x.visit(this, prefix));
    }

    this.visitParagraph = function(ast, args) {
        show(args, ast.toString() + `: Sentence[${ast.sentences.length}]`);
        let prefix = args + " | ";
        ast.sentences.forEach((x) => show(prefix, x));
    }

    this.visitSeparator = function(ast, args) {
        show(args, ast.toString());
    }

    this.visit = function(ast) {
        ast.visit(this, defaultprefix);
    }
}

exports.Displayer = Displayer;