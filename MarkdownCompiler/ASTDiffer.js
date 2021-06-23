/**
 * An AST visitor should define the following methods:
 */
let report = () => { throw "Unimplemented Abstract Method" };

let AST = require("./AST");

let GeneralVisitor = function() {

    // migrates the old AST's status to new AST
    this.diff = function(newAST, oldAST) {
        if (newAST && oldAST) newAST.visit(this, oldAST);
    }

    /**
     * 
     * @param {AST.MD} md 
     * @param {AST.MD} args 
     */
    this.visitMD = function(md, args) {
        // A markdown block contains all block items
        // if it is not of type Markdown then return false
        if (md.type != args.type) {
            return false;
        } 
        // else, we compare each children
        else {
            let p1 = 0;
            let p2 = 0;
            let len1 = md.blocks.length;
            let len2 = args.blocks.length;
            let newblock, oldblock, rem1, rem2;
            let results = [];
            while (p1 < len1 && p2 < len2) {
                newblock = md.blocks[p1];
                oldblock = args.blocks[p2];
                // diff newblock with oldblock
                // if not different, then replace new block with old block
                // else: handle based on the remaining length
                let compareResult = newblock.visit(this, oldblock);
                if (compareResult) {
                    md.blocks[p1] = args.blocks[p2];
                    p1 += 1;
                    p2 += 1;
                    results.push(true);
                } else {
                    // remaining length: 
                    //      if new block remains more than old blocks, then increment new block
                    //      if old block remains more than new blocks, then increment old block
                    //      if same, then increment both
                    rem1 = len1 - p1;
                    rem2 = len2 - p2;
                    if (rem1 < rem2) {
                        p2 += 1;
                    } else if (rem1 > rem2) {
                        p1 += 1;
                    } else {
                        p1 += 1;
                        p2 += 1;
                        results.push(false);
                    }
                }
            }
            return results.reduce((aggregator, currentval) => aggregator && currentval);
        }
    }

    this.visitParagraph = function(para, args) {
        // currently, paragraphs do not need to keep state records, so we can directly return false
        return false;
    }

    this.visitListItem = function(li, args) {
        // currently, list items do not need to keep state records, so we can directly return false
        return false;
    }

    this.visitSeparator = function(sep, args) {
        return false;
    }

    /**
     * 
     * @param {AST.CodeBlock} cb 
     * @param {AST.CodeBlock} args 
     */
    this.visitCodeBlock = function(cb, args) {
        if (args.type != cb.type) return false;
        // same if code type is the same and content is the same;
        return (cb.getType() == args.getType() && cb.get() == args.get());
    }

    this.visitLatexBlock = function(lb, args) {
        return false;
    }
    
    this.visitImage = function(img, args) {
        return false;
    }

    this.visitUL = function(ul, args) {
        return false;
    }

    this.visitOL = function(ol, args) {
        return false;
    }

    this.visitTODO = function(todo, args) {
        return false;
    }

    this.visitReference = function(ref, args) {
        return false;
    }

    this.visitReferenceSeparator = function(ref, args) {
        return false;
    }

    this.visitHeader = function(header, args) {
        return false;
    }

    this.visitSentence = function(sen, args) {
        return false;
    }

    this.visitInlineLatex = function(il, args) {
        return false;
    }

    this.visitLink = function(link, args) {
        return false;
    }
}

exports.Differ = GeneralVisitor;