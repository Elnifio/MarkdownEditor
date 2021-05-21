let show = function(prefix, content) {
    console.log(prefix + content);
}

let report = () => { throw "Unimplemented Abstract Method" };

let Displayer = function(defaultprefix="") {

    this.visit = function(ast) {
        ast.visit(this, defaultprefix);
    }

    this.visitMD = function(ast, args) {
        show(args, ast.toString() + `: Block[${ast.blocks.length}]`);
        let prefix = args + " | ";
        ast.blocks.forEach((x) => x.visit(this, prefix));
    }

    this.visitParagraph = function(ast, args) {
        show(args, ast.toString() + `: Sentence[${ast.sentences.length}]`);
        let prefix = args + " | ";
        ast.sentences.forEach((x) => x.visit(this, prefix));
    }

    this.visitSeparator = function(ast, args) {
        show(args, ast.toString());
    }

    this.visitCodeBlock = function(cb, args) {
        show(args, cb.toString() + `: {${cb.getType()}}`);
        let prefix = args + " | ";
        cb.get().split('\n').forEach((x) => console.log(prefix + x));
    }

    this.visitLatexBlock = function(lb, args) {
        show(args, lb.toString());
        let prefix = args + " | ";
        lb.get().split("\n").forEach((x) => console.log(prefix + x));
    }
    
    this.visitImage = function(img, args) {
        show(args, img.toString());
        let prefix = args + " | ";
        console.log(`${prefix}Src: ${img.get('src')}`); 
        console.log(`${prefix}Alt: ${img.get("alt")}`);
    }

    this.visitUL = function(ul, args) {
        show(args, ul.toString() + `: Sublist[${ul.getBlock().length}]`);
        let prefix = args + " | ";
        ul.getBlock().forEach((x) => x.visit(this, prefix));
    }

    this.visitOL = function(ol, args) {
        show(args, ol.toString() + `: Sublist[${ol.getBlock().length}]`);
        let prefix = args + " | ";
        ol.getBlock().forEach((x) => x.visit(this, prefix));
    }

    this.visitTODO = function(todo, args) {
        show(args, todo.toString() + `: Sublist[${todo.getBlock().length}]`);
        let prefix = args + " | ";
        todo.getBlock().forEach((x) => x.visit(this, `${prefix}[${x.status?"x":" "}] `));
    }

    this.visitReference = function(ref, args) {
        show(args, ref.toString() + ": Sentence[" + ref.content.length + "]");
        let prefix = args + " | ";
        // ref.get().visit(this, prefix);
        ref.get().forEach((x) => (this.visit(x, prefix)));
    }

    this.visitRefBlock = function(ref, args) {
        show(args, ref.toString() + ": Reference[" + ref.content.length + "]");
        let prefix = args + " | ";
        ref.get().forEach((x) => this.visit(x, prefix));
    }

    this.visitHeader = function(header, args) {
        show(args, header.toString() + ": " + header.level);
        let prefix = args + " | ";
        console.log(prefix + header.get());
    }

    this.visitSentence = function(sen, args) {
        show(args, sen.toString() + " with style: " + sen.style.toString());
        console.log(`${args} | ${sen.get()}`);
    }

    this.visitInlineLatex = function(il, args) {
        show(args, il.toString());
        console.log(`${args} | ${il.get()}`);
    }

    this.visitLink = function(link, args) {
        show(args, link.toString());
        let prefix = args + " | ";
        console.log(prefix + "Alt text:");
        link.get('alt').visit(this, prefix + "         ");
        console.log(prefix + "URL: " + link.get('url'));
    }
}

exports.Displayer = Displayer;