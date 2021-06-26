/**
 * An AST visitor should define the following methods:
 */
let AST = require("./AST");

let ZipperError = function(msg) {
    this.name = "Zipper Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

let GeneralVisitor = function() {

    this.zip = function(ast) {
        return ast.visit(this, undefined);
    }

    /**
     * 
     * @param {AST.MD} md 
     * @param {Object} args 
     */
    this.visitMD = function(md, args) {
        return {
            type: md.type,
            children: md.blocks.map(x => x.visit(this, args)),
            line: md.line
        }
    }

    this.visitParagraph = function(para, args) {
        return {
            type: para.type,
            children: para.sentences.map(x => x.visit(this, args)),
            line: para.line
        }
    }

    this.visitListItem = function(li, args) {
        return {
            type: li.type,
            children: li.sentences.map(x => x.visit(this, args)),
            line: li.line
        }
    }

    this.visitSeparator = function(sep, args) {
        return {
            type: sep.type,
            children: [],
            line: sep.line
        }
    }

    this.visitCodeBlock = function(cb, args) {
        return {
            type: cb.type,
            children: [], 
            line: cb.line,           
            content: cb.get(),
            codetype: cb.getType(),
            activated: cb.activated
        }
    }

    this.visitLatexBlock = function(lb, args) {
        return {
            type: lb.type,
            children: [],
            line: lb.line,
            content: lb.get(),
        }
    }
    
    this.visitImage = function(img, args) {
        return {
            type: img.type,
            children: [],
            line: img.line,
            property: img.property,
        }
    }

    this.visitUL = function(ul, args) {
        return {
            type: ul.type,
            children: ul.subBlocks.map(x => x.visit(this, args)),
            line: ul.line,
            indent: ul.indent,
        }
    }

    this.visitOL = function(ol, args) {
        return {
            type: ol.type,
            children: ol.subBlocks.map(x => x.visit(this, args)),
            line: ol.line,
            indent: ol.indent,
        }
    }

    this.visitTODO = function(todo, args) {
        return {
            type: todo.type,
            children: todo.sentences.map(x => x.visit(this, args)),
            line: todo.line,
            status: todo.status,
            idx: todo.todoIndex
        }
    }

    this.visitReference = function(ref, args) {
        return {
            type: ref.type,
            children: ref.sentences.map(x => x.visit(this, args)),
            line: ref.line,
        }
    }

    this.visitHeader = function(header, args) {
        return {
            type: header.type,
            level: header.level,
            content: header.get(),
            children: [],
            line: header.line
        }
    }

    this.visitSentence = function(sen, args) {
        return {
            type: sen.type,
            children: [],
            line: sen.line,
            content: sen.get(),
            style: sen.style.toObject(),
        }
    }

    this.visitReferenceSeparator = function(refsep, args) {
        return {
            type: refsep.type,
            children: [],
            line: refsep.line,
        }
    }

    this.visitInlineLatex = function(il, args) {
        return {
            type: il.type,
            children: [],
            line: il.line,
            content: il.get()
        }
    }

    this.visitLink = function(link, args) {
        return {
            type: link.type,
            children: [],
            line: link.line,
            property: link.property,
        }
    }
}
exports.ASTZipper = GeneralVisitor;

let ASTUnzipper = function(zipped) {
    let out;
    switch(zipped.type) {
        case AST.ASTTypes.MD: 
            out = new AST.MD();
            zipped.children.forEach(x => out.addBlock(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.Paragraph:
            out = new AST.Paragraph();
            zipped.children.forEach(x => out.addSentence(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.ListItem:
            out = new AST.ListItem();
            zipped.children.forEach(x => out.addSentence(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.Separator:
            out = new AST.Separator();
            break;
        case AST.ASTTypes.CodeBlock:
            out = new AST.CodeBlock();
            out.setType(zipped.codetype);
            out.activated = zipped.activated;
            out.set(zipped.content);
            break;
        case AST.ASTTypes.LatexBlock:
            out = new AST.LatexBlock();
            out.set(zipped.content);
            break;
        case AST.ASTTypes.Image:
            out = new AST.Image();
            out.property = zipped.property;
            break;
        case AST.ASTTypes.UL:
            out = new AST.UL();
            out.indent = zipped.indent;
            zipped.children.forEach(x => out.insertBlock(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.OL:
            out = new AST.OL();
            out.indent = zipped.indent;
            zipped.children.forEach(x => out.insertBlock(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.TODO:
            out = new AST.TODO();
            out.status = zipped.status;
            out.todoIndex = zipped.idx;
            zipped.children.forEach(x => out.addSentence(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.Reference:
            out = new AST.Reference();
            zipped.children.forEach(x => out.addSentence(ASTUnzipper(x)));
            break;
        case AST.ASTTypes.Header:
            out = new AST.Header();
            out.level = zipped.level;
            out.set(zipped.content);
            break;
        case AST.ASTTypes.Sentence:
            out = new AST.Sentence();
            zipped.style.forEach(x => out.setStyle(x, true));
            out.set(zipped.content);
            break;
        case AST.ASTTypes.ReferenceSeparator:
            out = new AST.RefSeparator();
            break;
        case AST.ASTTypes.Latex:
            out = new AST.InlineLatex();
            out.set(zipped.content);
            break;
        case AST.ASTTypes.Link:
            out = new AST.Link();
            out.property = zipped.property;
            break;
        default:
            throw new ZipperError(`At ASTUnzipper: unexpected type ${zipped.type} encountered;`);
    }
    out.line = zipped.line;
    return out;
}
exports.ASTUnzipper = ASTUnzipper;