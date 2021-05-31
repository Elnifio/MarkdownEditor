/**
 * An AST visitor should define the following methods:
 */

let Parser = require("./parser");

let Renderer = function() {
    this.parser = new Parser.Parser();

    this.render = function(text) {
        let ast = this.parser.parse(text);
        return this.visitMD(ast, undefined);
    }

    this.visitMD = function(md, args) {
        let element = document.createElement("div");
        md.blocks.forEach((x) => element.append(x.visit(this, args)));
        return element;
    }

    this.visitParagraph = function(para, args) {
        let p = document.createElement("p");
        para.sentences.forEach((x) => p.append(x.visit(this, args)));
        return p;
    }

    this.visitListItem = function(li, args) {
        let listitem = document.createElement("li");
        li.sentences.forEach((x) => listitem.append(x.visit(this, args)));
        return listitem;
    }

    this.visitSeparator = function(sep, args) {
        return document.createElement("hr");
    }

    this.visitCodeBlock = function(cb, args) {
        // might need to switch based on type
        let codeblock = document.createElement("p");
        codeblock.innerHTML = cb.get();
        return codeblock;
    }

    this.visitLatexBlock = function(lb, args) {
        let latexblock = document.createElement("div");
        latexblock.innerHTML = lb.get();
        return latexblock;
    }
    
    this.visitImage = function(img, args) {
        let image = document.createElement("img");
        image.src = img.get("src");
        image.alt = img.get("alt");
        return image;
    }

    this.visitUL = function(ul, args) {
        let unordered = document.createElement("ul");
        ul.getBlock().forEach(x => unordered.append(x.visit(this, args)));
        return unordered;
    }

    this.visitOL = function(ol, args) {
        let ordered = document.createElement("ol");
        ol.getBlock().forEach(x => ordered.append(x.visit(this, args)));
        return ordered;
    }

    this.visitTODO = function(todo, args) {
        let tContainer = document.createElement("div");
        if (todo.status) {
            // switch based on current status
        }
        else {
            // this todo is not yet completed
        }

        todo.sentences.forEach((x) => tContainer.append(x.visit(this, args)));
        return tContainer;
    }

    this.visitReference = function(ref, args) {
        let refContainer = document.createElement("p");
        ref.get().forEach((x) => refContainer.append(x.visit(this, args)));
        return refContainer;
    }


    this.visitHeader = function(header, args) {
        let h = document.createElement(`h${header.level}`);
        h.innerHTML = header.get();
        return h;
    }

    this.visitSentence = function(sen, args) {
        let span = document.createElement("span");
        span.innerHTML = sen.get();
        let style = sen.style.toString();
        if (style != "") {
            span.setAttribute("class", sen.style.toString());
        }
        return span;
    }

    this.visitInlineLatex = function(il, args) {
        let latex = document.createElement("span");
        latex.innerHTML = il.get();
        return latex;
    }

    this.visitLink = function(link, args) {
        let a = document.createElement("a");
        a.href = link.get("url");
        a.innerHTML = link.get("alt");
        console.log(a);
        return a;
    }
}

exports.Renderer = Renderer;