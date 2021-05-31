let Lexer = require("./lexer");
let TokenType = Lexer.TokenType;
let AST = require("./AST");

// debug use:
let displayer = require("./ASTDisplay");
let disp = new displayer.Displayer();
/**
 *  ------------------------------------------------
 *  Markdown Grammar: 
 *  ----------------
 *  # Entire Markdown file is constituted with collection of blocks
 *  # Each block ends with one or more \n
 *  MD              :=  (Block ENTER+)*
 *  
 *  # All possible Block-level elements
 *  Block           :=  Paragraph       # A single paragraph
 *                      Separator       # Separator, <hr />
 *                      CodeBlock       # Code Block, ```...```
 *                      LaTeX           # LaTeX, $$...$$
 *                      Image           # Image block - cannot create inline image
 *                      UnorderedList   # Unordered lists as block elements
 *                      OrderedList     # Ordered lists as block elements
 *                      TODOList        # Todo lists as block elements
 *                      Reference       # Reference block
 *                      Header          # Header block
 *  
 *  # A paragraph is a collection of Sentence, separated with \n
 *  Paragraph       :=  (Sentence ENTER)+
 *  
 *  # All collections of possible inline elements
 *  Sentence        :=  BasicSentence   # Basic Sentence - if any element parsing raise an error, we fall into this case
 *                      Bolds           # Bold Sentence - **...**
 *                      Italics         # Italic Sentence - *...*
 *                      StrikeThroughs  # StrikeThrough Sentence - ~~...~~
 *                      Underlines      # Underline Sentence - ~...~
 *                      InlineCodes     # Inline code blocks - `...`
 *                      InlineLaTeXs    # Inline LaTeX - $...$
 *                      Links           # Inline links - [...](...)
 * 
 *  # Basic sentences
 *  BasicSentence   :=  (not (ENTER, Identifiers)) *   # A sentence can contain anything except a ENTER, or inline-element identifiers, 
 *                                                       and should not start with SPACE
 *  
 *  # Styles
 *  Bolds           :=  BIdentifier Sentence? BIdentifier?
 *  Italics         :=  IIdentifier Sentence? IIdentifier?
 *  StrikeThroughs  :=  STIdentifier Sentence STIdentifier?
 *  Underlines      :=  ULIdentifier Sentence? ULIdentifier? 
 *  InlineCodes     :=  CIdentifier Sentence? CIdentifier?
 *  inlineLaTeXs    :=  LIdentifier Sentence? LIdentifier?
 *  Links           :=  LSQUARE Sentence? RSQUARE LPAREN Sentence? RPAREN
 * 
 *  # Styles Identifier
 *  BIdentifier     := (ASTERISK | UNDERLINE) length 2  # lookahead: if next is space, then collapse to Italics
 *  IIdentifier     := (ASTERISK | UNDERLINE) length 1  
 *  STIdentifier    := TILDA length 2                   # lookahead: if next is space, collapse to Underlines
 *  ULIdentifier    := TILDA length 1
 *  CIdentifier     := BACKTICK length 1
 *  LIdentifier     := DOLLAR length 1
 *
 *  # Separators
 *  Separator       := ((ASTERISK | MINUS) SPACE?)+
 *  
 */

let Parser = function() {
    this.accumulator = [];
    this.indentation = 0;
    this.curr = undefined;
    this.lexer = new Lexer.Lexer();
    this.liststack = [];
    this.todoList = false;
    this.eof = false;

    this.parse = function(text="") {
        this.lexer.init(text);
        this.nextToken();
        let out = this.parseMD();
        disp.visit(out);
        return out;
    }

    // the starter of MD is the union of:
    //      starter for paragraph - all starter for sentence
    //      starter for separator - TokenType.MINUS || TokenType.ASTERISK
    //      starter for ul - TokenType.MINUS || TokenType.ASTERISK
    //      starter for ol - TokenType.NUMBER + TokenType.PERIOD
    //      starter for todo - TokenType.MINUS + TokenType.SPACE + TokenType.LSQUARE + (SPACE || X) + TokenType.RSQUARE
    //      starter for CodeBlock & Latex - TokenType.BACKTICK * 3 || TokenType.DOLLAR * 2
    //      starter for Reference & Header - TokenType.GE || (TokenType.HASHTAG * 1~6)
    this.parseMD = function() {
        let md = new AST.MD();
        while (!this.eof) {
            switch(this.curr.type) {
                // only starter for Reference
                case TokenType.ge:
                    this.collectLists(md);
                    md.addBlock(this.parseReference());
                    this.indentation = 0;
                    break;

                // only starter for header
                case TokenType.hashtag:
                    this.collectLists(md);
                    md.addBlock(this.parseHeader());
                    this.indentation = 0;
                    break;

                // starter for separator and unordered list
                case TokenType.minus:
                    this.parseMinus(md);
                    this.indentation = 0;
                    break;

                case TokenType.number:
                    this.parseOL(this.indentation, md);
                    this.indentation = 0;
                    break;

                case TokenType.todo:
                    this.collectLists(md);
                    md.addBlock(this.parseTODO(false));
                    this.indentation = 0;
                    break;

                case TokenType.todoSuccess:
                    this.collectLists(md);
                    md.addBlock(this.parseTODO(true));
                    this.indentation = 0;
                    break;

                case TokenType.imageSt:
                    this.collectLists(md);
                    md.addBlock(this.parseImg());
                    this.indentation = 0;
                    break;
                
                case TokenType.space:
                    this.indentation = this.curr.content.length;
                    this.accept(TokenType.space);
                    break;

                case TokenType.enter:
                    this.collectLists(md);
                    this.indentation = 0;
                    this.consume(TokenType.enter);
                    break;

                case TokenType.backtick:
                    if (this.is(TokenType.backtick, 3)) {
                        md.addBlock(this.parseCodeBlock());
                    } else {
                        md.addBlock(this.parseParagraph());
                    }

                default:
                    md.addBlock(this.parseParagraph());
                    this.indentation = 0;
            }
        }
        this.collectLists(md);
        return md;
    }

    this.showList = function() {
        this.liststack.forEach((x) => {
            console.log(x.type + " Indent: " + x.indent);
            console.log("    " + x.subBlocks.length);
            x.subBlocks.forEach((y) => {
                console.log("        " + y.type);
                console.log("        " + y.sentences.length);
                y.sentences.forEach((z) => {
                    console.log("            " + z.content);
                })
            })
        })
    }

    this.collectLists = function(markdownContainer) {
        if (this.liststack.length == 0) return;
        let lastBlock;
        while (this.liststack.length > 1) {
            lastBlock = this.liststack.pop();
            this.liststack[this.liststack.length-1].insertBlock(lastBlock);
        }
        markdownContainer.addBlock(this.liststack.pop());
        return;
    }

    this.parseCodeBlock = function() {
        this.consume(TokenType.backtick);
        let cb = new AST.CodeBlock();
        while (!this.is(TokenType.enter) && !this.eof) {
            this.acceptAny();
        }
        cb.setType(this.collect());
        this.emptyAccumulator();
        if (this.eof) return cb;
        this.consume(TokenType.enter);
        while (!this.is(TokenType.backtick, 3) && !this.eof) {
            this.acceptAny();
        }
        cb.set(this.collect());
        if (!this.eof) {
            this.accept(TokenType.backtick, 3);
            while (!this.is(TokenType.enter) && !this.eof) {
                this.acceptAny();
            }
            if (!this.eof) this.accept(TokenType.enter);
        }
        this.emptyAccumulator();
        return cb;
    }

    this.parseMinus = function(markdownContainer) {
        // accept all minus and spaces
        let minusLength = 0;
        while (this.is(TokenType.minus) || this.is(TokenType.space) && !this.eof) {
            if (this.is(TokenType.minus)) {
                minusLength += this.curr.content.length;
            }
            this.acceptAny();
        }

        // if next is end of a line: either return a separator or a paragraph
        if (this.is(TokenType.enter)) {
            if (minusLength >= 3) {
                this.accept(TokenType.enter);
                markdownContainer.addBlock(new AST.Separator());
                return;
            } else {
                this.accept(TokenType.enter);
                let para = new AST.Paragraph();
                let sen = new AST.Sentence();
                sen.set(this.collect());
                para.addSentence(sen);
                markdownContainer.addBlock(para);
                return;
            }
        }
        // as a list block starter: first check that the length of the minus sign is 1
        // and then check if the last token on the accumulator is space
        if (minusLength == 1 && this.accumulator[this.accumulator.length-1].type == TokenType.space) {
            // is a list, we handle parsing of list inside function parseUL
            this.emptyAccumulator();
            this.parseUL(this.indentation, markdownContainer);
        } else {
            // is not a list, we handle the rest of the sentence inside parseParagraph;
            markdownContainer.addBlock(this.parseParagraph());
        }
    }

    // parsing of a UL
    this.parseUL = function(indent, markdownContainer) {
        /**
         *  On initializing the list stack, we should push the MD block onto the list stack
         *  we have cases: 
         *      1.  list stack is empty:
         *              we create one new list block, 
         *              add it to the list stack,
         *              parse sentences as list item, 
         *              and push the list block onto the last list block
         *      2.  list stack is not empty, 
         *          and the last item in list block is either not a ul or has indentation > current
         *              we **recursively pop the blocks until the indentation <= current**
         *              1. if after poping, the stack is empty:
         *                      we push the last popped block onto the markdownContainer
         *                      create one new list block
         *                      add it to the list stack
         *                      parse the rest as paragraph and add it to the current list block
         *              2. else: the stack is not empty
         *                      we push the last popped block onto the last item in the stack
         *                      create one new list block
         *                      add it to the list stack
         *                      parse the rest as paragraph and add it to the current list block
         *              and start parse a list item, add the list item to the current list block
         *      3.  list stack is not empty, 
         *          and the last item in list block is a UL and has indentation == current
         *              start parse a list item, add the list item to the last list block
         *      4.  list stack is not empty,
         *          and the last item in list block is a UL and has indentation < current
         *              we push this newly created block onto the stack
         *              start parse a list item, add the list item to the last list block
         */

        if (this.liststack.length == 0) {
            let newlb = new AST.UL();
            newlb.indent = indent;
            this.liststack.push(newlb);
            /**
             *  list stack is empty:
             *      we create one new list block, 
             *      add it to the list stack,
             *      parse sentences as list item, 
             *      and push the list block onto the last list block
             */
            let newli = new AST.ListItem();
            newli = this.parseParagraph(newli);
            newlb.subBlocks.push(newli);
            return;
        }

        // list stack is not empty, 
        // and the last item in list block is either not a ul or has indentation > current
        //      we **recursively pop the blocks until the indentation <= current**
        //      1. if after poping, the stack is empty:
        //          we push the last popped block onto the markdownContainer
        //          create one new list block
        //          add it to the list stack
        //          parse the rest as paragraph and add it to the current list block
        //      2. else: the stack is not empty
        //          we push the last popped block onto the last item in the stack
        //          create one new list block
        //          add it to the list stack
        //          parse the rest as paragraph and add it to the current list block
        // and start parse a list item, add the list item to the current list block
        let lastBlock = this.liststack[this.liststack.length-1];
        while (lastBlock.indent > indent || (lastBlock.indent == indent && lastBlock.type != AST.ASTTypes.UL)) {
            lastBlock = this.liststack.pop(); 
            if (this.liststack.length == 0) {
                markdownContainer.addBlock(lastBlock);
                let newlb = new AST.UL();
                newlb.indent = indent;
                this.liststack.push(newlb);
                let newli = new AST.ListItem();
                newli = this.parseParagraph(newli);
                newlb.subBlocks.push(newli);
                return;
            } else {
                this.liststack[this.liststack.length-1].subBlocks.push(lastBlock);
                lastBlock = this.liststack[this.liststack.length-1];
            }
        }
        // after this recursion, we see that 
        // last block must have indent <= current indent, and 
        // must have type UL
        // 3. list stack is not empty, 
        //    and the last item in list block is a UL and has indentation == current
        //          start parse a list item, add the list item to the last list block
        // 4. list stack is not empty,
        //    and the last item in list block is a UL and has indentation < current
        //          we push this newly created block onto the stack
        //          start parse a list item, add the list item to the last list block
        if (lastBlock.indent != indent) {
            lastBlock = new AST.UL();
            lastBlock.indent = indent;
            this.liststack.push(lastBlock);
        }
        let newli = new AST.ListItem();
        newli = this.parseParagraph(newli);
        lastBlock.subBlocks.push(newli);
    }

    // parsing of a OL, similar to parsing of a UL
    this.parseOL = function(indent, markdownContainer) {
        this.consume(TokenType.number);
        if (this.is(TokenType.space)) {
            this.consume(TokenType.space);
        }
        /**
         *  parsing of OL should be nearly the same as parsing of UL: 
         *  we have cases: 
         *      1.  list stack is empty:
         *              we create one new list block, 
         *              add it to the list stack,
         *              parse sentences as list item, 
         *              and push the list block onto the last list block
         *      2.  list stack is not empty, 
         *          and the last item in list block is either not a ol or has indentation > current
         *              we **recursively pop the blocks until the indentation <= current**
         *              1. if after poping, the stack is empty:
         *                      we push the last popped block onto the markdownContainer
         *                      create one new list block
         *                      add it to the list stack
         *                      parse the rest as paragraph and add it to the current list block
         *              2. else: the stack is not empty
         *                      we push the last popped block onto the last item in the stack
         *                      create one new list block
         *                      add it to the list stack
         *                      parse the rest as paragraph and add it to the current list block
         *              and start parse a list item, add the list item to the current list block
         *      3.  list stack is not empty, 
         *          and the last item in list block is a ol and has indentation == current
         *              start parse a list item, add the list item to the last list block
         *      4.  list stack is not empty,
         *          and the last item in list block is a ol and has indentation < current
         *              we push this newly created block onto the stack
         *              start parse a list item, add the list item to the last list block
         */
        if (this.liststack.length == 0) {
            let newlb = new AST.OL();
            newlb.indent = indent;
            this.liststack.push(newlb);
            let newli = new AST.ListItem();
            newli = this.parseParagraph(newli);
            newlb.subBlocks.push(newli);
            return;
        }

        let lastBlock = this.liststack[this.liststack.length-1];
        while ((lastBlock.indent > indent || (lastBlock.indent == indent && lastBlock.type != AST.ASTTypes.OL))) {
            lastBlock = this.liststack.pop();
            if (this.liststack.length == 0) {
                markdownContainer.addBlock(lastBlock);
                let newlb = new AST.OL();
                newlb.indent = indent;
                this.liststack.push(newlb);
                let newli = new AST.ListItem();
                newli = this.parseParagraph(newli);
                newlb.subBlocks.push(newli);
                return;
            } else {
                this.liststack[this.liststack.length-1].subBlocks.push(lastBlock);
                lastBlock = this.liststack[this.liststack.length-1];
            }
        }

        if (lastBlock.indent != indent) {
            lastBlock = new AST.OL();
            lastBlock.indent = indent;
            this.liststack.push(lastBlock);
        }
        let newli = new AST.ListItem();
        newli = this.parseParagraph(newli);
        lastBlock.subBlocks.push(newli);
    }

    this.parseTODO = function(todoSuccess) {
        // not a TODO list, but we parse it as a single block-level element
        // accept a single TODO indicator and start parsing a paragraph element
        this.acceptAny();
        this.emptyAccumulator();
        let todo = new AST.TODO();
        todo.status = todoSuccess;
        todo = this.parseParagraph(todo);
        return todo;
    }

    this.parseImg = function() {
        this.accept(TokenType.imageSt);
        while (!this.eof) {
            if (this.is(TokenType.rsquare)) {
                this.accept(TokenType.rsquare);
                if (this.is(TokenType.lparen)) {
                    this.accept(TokenType.lparen);
                    break;
                } else {
                    return this.parseParagraph();
                }
            } else if (this.is(TokenType.enter)) {
                return this.parseParagraph();
            } else {
                this.acceptAny();
            }
        }

        if (this.eof) return this.parseParagraph();

        let content = this.collect();
        let img = new AST.Image();
        img.set("alt", content.substr(2, content.length - 4));
        this.emptyAccumulator();
        while (!this.eof && !this.is(TokenType.enter) && !this.is(TokenType.rparen)) {
            this.acceptAny();
        }
        if (this.is(TokenType.rparen)) this.consume(TokenType.rparen);
        img.set("src", this.collect());
        return img;
    }

    // parse a paragraph
    // the paragraph ends with either eof or an additional \n
    this.parseParagraph = function(para=undefined) {
        let paragraph;
        if (!para) paragraph = new AST.Paragraph();
        else paragraph = para;
        
        let separator = new AST.Sentence();
        separator.set(" ");
        // if we encounter any of these elements below, 
        // we know that they must be inline elements, 
        // so we continue adding bulk sentence to the paragraph
        //      word: inline ordinary elements
        //      \*: inline elements for bold and italic
        //      $ of length 1: inline elements for inline latex
        //      ` of length 1: inline elements for code
        //      ~: inline elements for strikethrough and underline
        //      [: inline elements for links
        //      ], (, ): arbitrary word element
        //      _: inline element for bold and italic
        // ------------------------
        // Other elements might denote starting of a block-level elements: 
        //      number: might denote starting of an ordered list
        //      minus: might denote starting of a separator or an unordered list
        //      space: might denote some indentation
        //      \todo & \todoSuccess: might denote start of a todo list
        //      $ of length 2: starting of latex block
        //      ` of length 3: starting of code block
        //      #: denote header
        //      >: starting of a reference block
        //      \n: denote the end of a block
        //      \!: image block
        do {
            this.parseBulkSentence(paragraph.sentences);
            paragraph.addSentence(separator);
        } while ((this.is(TokenType.word) || this.is(TokenType.asterisk) || this.is(TokenType.underline)
                || this.is(TokenType.dollar, 1) || (this.is(TokenType.backtick, 1) || this.is(TokenType.backtick, 2))
                || this.is(TokenType.lsquare) || this.is(TokenType.tilda) || this.is(TokenType.underline)
                || this.is(TokenType.rparen) || this.is(TokenType.lparen) || this.is(TokenType.rsquare)) 
                && !this.eof);
        return paragraph; 
    }

    // parse a Reference block
    // only enter from parseMD
    // first accept a > sign
    // if next is space: reference; else: sentence
    this.parseReference = function() {
        let ref = new AST.Reference();
        while (this.is(TokenType.ge)) {
            this.accept(TokenType.ge);
            if (this.is(TokenType.space)) {
                this.emptyAccumulator();
                this.curr.content = this.curr.content.substr(1);
                this.accept(TokenType.space);
                while (!this.is(TokenType.ge) && !this.is(TokenType.enter) && !this.eof) {
                    this.parseBulkSentence(ref.content);
                }
            } else {
                if (ref.isEmpty()) {
                    return this.parseParagraph();
                } else {
                    while (!this.is(TokenType.ge) && !this.is(TokenType.enter) && !this.eof) {
                        this.parseBulkSentence(ref.content);
                    }
                }
            }
        }
        return ref;
    }

    this.parseHeader = function() {
        let h = new AST.Header();
        h.level = this.curr.content.length;
        this.accept(TokenType.hashtag);
        if (this.is(TokenType.space)) {
            this.consume(TokenType.space);
            this.emptyAccumulator();
            while (!this.is(TokenType.enter) && !this.eof) {
                this.acceptAny();
            }
            this.consume(TokenType.enter);
            h.set(this.collect());
            this.emptyAccumulator();
            return h;
        } else if (h.level==1) {
            this.emptyAccumulator();
            // construct label? currently replace it with a header parser
            while (!this.is(TokenType.enter) && !this.eof) {
                this.acceptAny();
            }
            this.consume(TokenType.enter);
            h.set(this.collect());
            this.emptyAccumulator();
            return h;
        } else {
            return this.parseParagraph();
        }
    }

    this.parseLatexBlock = function() {
        this.accept(TokenType.dollar);
        let proceed = this.accept(TokenType.enter);
        let out;
        if (proceed) {
            out = new AST.LatexBlock();
            while (this.curr != undefined && !this.is(TokenType.dollar, 2)) {
                this.acceptAny();
            }
            this.accept(TokenType.dollar);
            out.set(this.collect());
            return out;
        }
        else {
            out = this.parseSentence();
            return out;
        }
    }

    this.lastStyle = new AST.StyleConstructor();
    this.parseBulkSentence = function(sentences=[]) {
        // parse a bunch of sentences until \n
        // if current is a single $: start parse a inline latex
        // if current is a single [: start parse a link
        // other styles are handled in parseSentence
        let currsen;
        do {
            if (this.is(TokenType.dollar, 1)) {
                currsen = this.parseInlineLatex();
            }
            else if (this.is(TokenType.lsquare)) {
                currsen = this.parseLink();
            }
            else {
                currsen = this.parseSentence(this.lastStyle);
            }
            sentences.push(currsen);
        } while (!this.is(TokenType.enter) && !this.eof);
        this.consume(TokenType.enter);
        return sentences;
    }

    this.parseInlineLatex = function() {
        this.consume(TokenType.dollar);
        let sentence = new AST.InlineLatex();
        // accept anything after a single $
        while (!this.eof && !this.is(TokenType.enter)) {
            if (this.is(TokenType.dollar)) {
                if (this.curr.content.length == 2) {
                    this.curr.content = "$";
                } else {
                    this.consume(TokenType.dollar);
                }
                sentence.set(this.collect());
                this.emptyAccumulator();
                return sentence;
            } else {
                this.acceptAny();
            }
        }
        sentence.set(this.collect());
        this.emptyAccumulator();
        return sentence;
    }

    this.parseLink = function() {
        // assume that when called, current token is [
        this.acceptAny();
        // accepts description text:
        while (!this.eof) {
            if (this.is(TokenType.enter)) {
                // did not properly finish a link, we directly collect current items and return a sentence
                let sen = new AST.Sentence();
                sen.set(this.collect());
                this.emptyAccumulator();
                return sen;
            } else 
            // else: if properly finishes the description text:
            if (this.is(TokenType.rsquare)) {
                this.accept(TokenType.rsquare);
                break;
            }
            this.acceptAny();
        }

        // if eof encountered: we parse sentence
        if (this.eof) {
            return this.parseSentence();
        }

        // followed by ], we should accept a (
        // if not, we collect current content and return a sentence
        if (!this.is(TokenType.lparen)) {
            // previous items already in the accumulator
            // so when parsing the sentence, 
            // all previous items are memorized by the accumulator and thus
            // included in the sentence. 
            return this.parseSentence();
        }

        // else: we accept a left parenthesis
        let link = new AST.Link();
        let currContent = this.collect();
        link.set("alt", currContent.substr(1, currContent.length - 2));
        this.consume(TokenType.lparen);
        this.emptyAccumulator();
        while (!this.eof) {
            // proper close of a link
            if (this.is(TokenType.rparen)) {
                link.set("url", this.collect());
                this.consume(TokenType.rparen);
                this.emptyAccumulator();
                return link;
            } else 
            // unexpected close of a link: \n encountered
            if (this.is(TokenType.enter)) {
                link.set("url", this.collect());
                this.emptyAccumulator();
                return link;
            } else {
                // still constructing the link's content
                this.acceptAny();
            }
        }
        // unexpected close of a link: eof encountered
        link.set("url", this.collect());
        this.emptyAccumulator();
        return link;
    }

    // yield one sentence at a time
    this.parseSentence = function(style=undefined) {
        let current = new AST.Sentence();
        current.style = this.constructStyle(style);
        
        let tokenLength;
        // consume token until \n
        while (!this.is(TokenType.enter) && !this.eof) {
            // switch based on current token:
            // if is inline element denoter: special case
            // else: not inline element denoter: collect it
            tokenLength = this.curr.content.length;
            if (tokenLength == 0) {
                break;
            }
            switch(this.curr.type) {
                // special inline element denoter: 
                // either * or _, and we need to discuss its case
                case TokenType.asterisk:
                case TokenType.underline:
                    if (tokenLength == 2) {
                        // if current is already bold: then we simply consume it and return;
                        // else: current is not bold, we directly return current sentence;
                        this.endStyle(current.style);
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    } 
                    else {
                        // else: we hit the case for italic
                        // if current is already italic: we simply consume it and return;
                        // else: current is not italic, we return current sentence;
                        this.endStyle(current.style);
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    }
                case TokenType.tilda:
                    if (tokenLength == 2) {
                        // if current is already strikethrough: then we simply consume it and return;
                        // else: we directly build sentence and return
                        this.endStyle(current.style);
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    } else {
                        this.endStyle(current.style);
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    }
                case TokenType.backtick:
                    if (tokenLength != 2) {
                        // if current is not 2: we hit an indicator to change the style
                        this.endStyle(current.style);
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    } else {
                        // else: we consume it and continue parsing
                        this.consume(TokenType.backtick);
                        break;
                    }
                case TokenType.dollar:
                    // either 1 dollar or 2 dollars
                    // on 1 dollar case, we simply return
                    // on 2 dollar case, we consume it and continue parsing
                    if (tokenLength == 1) {
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    }
                    else {
                        this.consume(TokenType.dollar);
                        break;
                    }
                // SPECIAL CASE for link: 
                // directly return current sentence
                case TokenType.lsquare:
                    current.set(this.collect());
                    this.emptyAccumulator();
                    return current;
                
                case TokenType.eof:
                    break;
                // all other default case: accept it, add it to current accumulator
                default:
                    this.acceptAny();
            }
        }
        // hits the \n after the sentence, we collect the content and return
        current.set(this.collect());
        this.emptyAccumulator();
        return current;
    }

    this.endStyle = function(style) {
        let tokenLength;
        for (st in style) {
            this.lastStyle[st] = style[st];
        }
        while ((this.is(TokenType.asterisk) || this.is(TokenType.backtick) 
                || this.is(TokenType.underline) || this.is(TokenType.tilda)) && !this.eof) {
            tokenLength = this.curr.content.length;
            switch(this.curr.type) {
                case TokenType.asterisk:
                case TokenType.underline:
                    if (tokenLength == 1) {
                        if (style.italic) {
                            this.consume(this.curr.type);
                            this.lastStyle.italic = !this.lastStyle.italic;
                        } else {
                            return;
                        }
                    } else {
                        if (style.bold) {
                            this.consume(this.curr.type);
                            this.lastStyle.bold = !this.lastStyle.bold;
                        } else {
                            return;
                        }
                    }
                    break;
                case TokenType.backtick:
                    if (tokenLength != 2) {
                        if (style.code) {
                            this.consume(this.curr.type);
                            this.lastStyle.code = !this.lastStyle.code;
                        } else {
                            return;
                        }
                    }
                    else {
                        this.consume(this.curr.type);
                    }
                    break;
                case TokenType.tilda:
                    if (tokenLength == 2) {
                        if (style.strikethrough) {
                            this.consume(this.curr.type);
                            this.lastStyle.strikethrough = !this.lastStyle.strikethrough;
                        } else {
                            return;
                        }
                    } else {
                        if (style.underline) {
                            this.consume(this.curr.type);
                            this.lastStyle.underline = !this.lastStyle.underline;
                        } else {
                            return;
                        }
                    } 
                    break;
                default:
                    throw "Unexpected TokenType";
            }
        }
        return;
    }

    this.constructStyle = function(givenStyle=undefined) {
        let style = new AST.StyleConstructor();
        if (givenStyle) {
            for (st in givenStyle) {
                style[st] = givenStyle[st];
            }
        }
        let tokenLength;
        // first construct style for current sentence
        while ((this.is(TokenType.asterisk) || this.is(TokenType.backtick) 
        || this.is(TokenType.underline) || this.is(TokenType.tilda)) && !this.eof) {
            tokenLength = this.curr.content.length;
            switch(this.curr.type) {
                case TokenType.asterisk:
                case TokenType.underline:
                    if (tokenLength == 1) {
                        style.italic = !style.italic;
                    } else {
                        style.bold = !style.bold;
                    }
                    break;
                case TokenType.backtick:
                    if (tokenLength != 2) {
                        style.code = !style.code;
                    }
                    break;
                case TokenType.tilda:
                    if (tokenLength == 2) {
                        style.strikethrough = !style.strikethrough;
                    } else {
                        style.underline = !style.underline;
                    }
                    break;
                default:
                    throw "Unexpected TokenType";
            }
            this.consume(this.curr.type);
        }
        return style;
    }

    // ------------------------
    // 
    // auxiliary methods
    // 
    // ------------------------
    this.acceptAny = function() {
        this.accumulator.push(this.curr);
        this.nextToken();
    }

    /**
     * 
     * @param {TokenType: String} type 
     * @returns {boolean} consumeSuccess?
     * Try and consume a given token type
     * and return if the type matches
     */
    this.accept = function(type) {
        if (this.curr.type == type) {
            let out = this.accumulator.push(this.curr);
            this.nextToken();
            return out;
        } else {
            return undefined;
        }
    }

    this.consume = function(type) {
        if (this.curr.type == type) {
            let out = this.curr;
            this.nextToken();
            return out;
        } else {
            return undefined;
        }
    }

    this.is = function(type, length=-1) {
        if (length < 0) {
            return this.curr.type == type;
        } else {
            return this.curr.type == type && this.curr.content.length == length;
        }
    }

    this.collect = function() {
        return this.accumulator.reduce((accu, curr) => accu + curr.content, "");
    }

    this.emptyAccumulator = function() {
        this.accumulator = [];
    }

    this.nextToken = function() {
        this.curr = this.lexer.yield();
        if (this.curr == undefined) {
            this.curr = new Lexer.Token(TokenType.word, "");
            this.eof = true;
        }
    }
}
exports.Parser = Parser;
