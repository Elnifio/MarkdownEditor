/**
 * An AST visitor should define the following methods:
 */
let report = () => { throw "Unimplemented Abstract Method" };

let GeneralVisitor = function() {
    this.visitMD = function(md, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitParagraph = function(para, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitListItem = function(li, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitSeparator = function(sep, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitCodeBlock = function(cb, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitLatexBlock = function(lb, args) {
        // TODO: REPLACE THIS
        report();
    }
    
    this.visitImage = function(img, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitUL = function(ul, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitOL = function(ol, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitTODO = function(todo, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitReference = function(ref, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitRefBlock = function(ref, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitHeader = function(header, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitSentence = function(sen, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitInlineLatex = function(il, args) {
        // TODO: REPLACE THIS
        report();
    }

    this.visitLink = function(link, args) {
        // TODO: REPLACE THIS
        report();
    }
}

// exports.AbstractVisitor = GeneralVisitor;