let Lexer = require("./lexer");
let TokenType = Lexer.TokenType;
let AST = require("./AST");
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
    this.specialsCollector = [];
    this.curr = undefined;
    this.lexer = new Lexer.Lexer();

    this.parse = function(text="") {
        this.lexer.init(text);
        this.nextToken();
        let out = this.parseMD();
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
        while (!this.lexer.eof) {
            switch(this.curr.type) {
                // only starter for Reference
                case TokenType.ge:
                    md.addBlock(this.parseReference());
                    break;
                case TokenType.hashtag:
                    break;
            }
        }
    }

    // parse a Reference block
    // only enter from parseMD
    // first accept a > sign
    // if next is space: reference; else: sentence
    this.parseReference = function() {
        this.accept(TokenType.ge);
        if (this.is(TokenType.space)) {
            // on accepting a reference:
            // first accept a space, and delete the first space character in the space sequence
            // and while next is not an enter: accept it as a sentence
            this.acceptAny();
            let space = this.accumulator[this.accumulator.length - 1];
            this.emptyAccumulator();

            space.content = space.content.substr(1);
            this.accumulator.push(space);

            let r = new AST.Reference();
            let sen;

            // sentence builder
            while (!this.is(TokenType.enter)) {
                sen = this.parseSentence();
                r.push(sen);
            }
            return r;
        }
        else {
            return this.parseSentence();
        }
    }

    this.parseReferenceBlock = function() {
        let rblock = new AST.RefBlock();
        let result;
        // accept anything as a sentence
        // until a single line of \n encountered
        while (!this.is(TokenType.enter)) {
            if (this.is(TokenType.ge)) {
                this.acceptAny();
                if (this.is(TokenType.space)) {
                    this.acceptAny();
                    result = this.parseReference();
                }
            }
            // // switch based on current character: 
            // if (this.is(TokenType.ge)) {
            //     result = this.parseReference();
            // } else {
            //     result = this.parseSentence();
            // }
            
            // if (result.type == AST.ASTTypes.Reference) {
            //     rblock.push(result);
            // } else {
            //     rblock.modifyLast(result);
            // }
        }
        return rblock;
    }

    this.parseHeader = function() {
        let h = new AST.Header();
        h.level = this.curr.content.length;

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

    this.parseBulkSentence = function(sentences=[]) {
        // parse a bunch of sentences until \n
        let currsen;
        do {
            currsen = this.parseSentence();
            sentences.push(currsen);
        } while (!this.is(TokenType.enter));
        this.consume(TokenType.enter);
        return sentences;
    }


    // yield one sentence at a time
    this.parseSentence = function() {
        let current = new AST.Sentence();
        current.style = this.constructStyle();
        
        let tokenLength;
        // consume token until \n
        while (!this.is(TokenType.enter)) {
            // switch based on current token:
            // if is inline element denoter: special case
            // else: not inline element denoter: collect it
            tokenLength = this.curr.content.length;
            switch(this.curr.type) {
                // special inline element denoter: 
                // either * or _, and we need to discuss its case
                case TokenType.asterisk:
                case TokenType.underline:
                    if (tokenLength == 2) {
                        // if current is already bold: then we simply consume it and return;
                        // else: current is not bold, we directly return current sentence;
                        if (current.style.bold) {
                            this.consume(this.curr.type);
                        }
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    } 
                    else {
                        // else: we hit the case for italic
                        // if current is already italic: we simply consume it and return;
                        // else: current is not italic, we return current sentence;
                        if (current.style.italic) {
                            this.consume(this.curr.type);
                        }
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    }
                case TokenType.tilda:
                    if (tokenLength == 2) {
                        // if current is already strikethrough: then we simply consume it and return;
                        // else: we directly build sentence and return
                        if (current.style.strikethrough) {
                            this.consume(TokenType.tilda);
                        }
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    } else {
                        if (current.style.underline) {
                            this.consume(TokenType.tilda);
                        }
                        current.set(this.collect());
                        this.emptyAccumulator();
                        return current;
                    }
                case TokenType.backtick:
                    if (tokenLength != 2) {
                        // if current is not 2: we hit an indicator to change the style
                        if (current.style.code) {
                            this.consume(TokenType.backtick);
                        }
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
                case TokenType.lsqaure:
                    current.set(this.collect());
                    this.emptyAccumulator();
                    return current;
                
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

    this.constructStyle = function() {
        let style = new AST.StyleConstructor();
        let tokenLength;
        // first construct style for current sentence
        while (this.is(TokenType.asterisk) || this.is(TokenType.backtick) 
        || this.is(TokenType.underline) || this.is(TokenType.tilda)) {
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
    }
}
exports.Parser = Parser;
