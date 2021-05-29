/** 
 * A Markdown file would consist of the following special characters: 
 *  \: translate char, translate the following character into its original meaning
 *  $: dollar char, indicate a beginning & end of inline latex
 *  `: backtick, indicating beginning & end of code segment
 *  #: hashtag, indicating beginning of a header
 *  -: minus
 *  [: left square
 *  ]: right square
 *  >: ge, reference block
 *   : space character (\t == 4 * space)
 *  _: underline
 *  \*: asterisk
 *  ~: tilda
 *  .: period
 * all other characters are normal characters
 */
let specials = ["\\", "$", "`", "#", "-", "[", "]", ">", " ", "_", "*", "~", ".", "\n", "!", "(", ")"];

// Token Types enumeration: 
let TokenType = {
    word        : 0,    // Words
    number      : 1,    // Numbers      - used in ordered lists
    asterisk    : 2,    // asterisks    - used in styles, unordered lists, separators
    minus       : 3,    // minus        - used in unordered lists, separators, and TODOs
    space       : 4,    // space        - used for indentation
    translate   : 5,    // translate    - used for translating next token
    dollar      : 6,    // dollar       - used for inline LaTeX
    backtick    : 7,    // backtick     - used for code renderings
    hashtag     : 8,    // hashtag      - used for headers
    lsquare     : 9,    // left square  - used for links and images
    rsquare     : 10,   // right square - used for links and images
    ge          : 11,   // right arrow  - used for references
    underline   : 12,   // underline    - used in styles
    tilda       : 13,   // tilda        - used in styles
    todo        : 14,   // \todo token  - used solely for TODOs
    todoSuccess : 15,   // \todo finished token   
    enter       : 16,   // enter: \n    - used to denote end of a line
    imageSt     : 17,   // Image ST: ![ - used for image starter
    lparen      : 18,   // parenthesis  - used for urls
    rparen      : 19,   // parenthesis  - used for urls

    // convert from TokenType to literal
    finder      : (type) => { for (let item in TokenType) { if (TokenType[item] == type) return item; } },
};

// locks the enumeration
Object.freeze(TokenType);

// Token object: (type, content) tuple
/**
 * 
 * @param {TokenType: String} type TokenType enum: type of the token
 * @param {String} content String: Content of the token
 */
let Token = function(type, content) { 
    this.type = type; 
    this.content = content;

    // debug use
    this.literalType = TokenType.finder(this.type);
};

exports.Token = Token;

//  Lexer object: 
//      call lexer.init to reset a lexer
//      call lexer.yield to yield the next token
/**
 * 
 * @param {String} text initial text: unused
 */
let Lexer = function(text="") {
    // initiate the lexer status
    this.text = text;
    this.cursor = 0;
    this.eof = false;
    this.maxlen = this.text.length;
    this.currentToken = "";

    // initialization
    /**
     * 
     * @param {String} newinput text to be lexed
     */
    this.init = function(newinput) {
        // initiate the lexer status
        this.text = newinput;
        this.cursor = 0;
        this.eof = false;
        this.currentToken = "";
        this.maxlen = this.text.length;
    };

    /**
     * yields one token at a time
     * @returns Token next token
     */
    this.yield = function() {
        if (!this.eof) {
            this.currentToken = "";
            let type = this.scantoken();
            return new Token(type, this.currentToken);
        }
    };

    /**
     * Scan token based on next token
     * @returns TokenType next token's type
     */
    this.scantoken = function() {
        let nextToken = this.peekNext();
        // perform case-by-case analysis
        switch (nextToken) {
            // --------
            // special character: \n
            // --------
            // accept one \n at a time
            case "\n":
                this.acceptIt();
                return TokenType.enter;

            // -------- 
            // style controller: bold, italic, strikethrough, underline (or possibly unordered list & separator)
            // --------
            // accepts a sequence of control characters: "***" -> Token(TokenType.asterisk, "***")
            // necessary for italic, bold, italic-bold, separator, unordered list
            case "*": 
                this.acceptSame(nextToken, 2); // maximum set to 2
                return TokenType.asterisk;

            // necessary for separator, unordered list
            case "-": 
                if (this.remain(5) && this.currentToken == "") {
                    // currently at -, and the next sequence is - [ ]
                    // with at least one space after it
                    let nextfour = this.text.substr(this.cursor, 6);
                    if (nextfour == "- [ ] ") {
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptSame(" ");
                        return TokenType.todo;
                    } else if (nextfour == "- [x] ") {
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptIt();
                        this.acceptSame(" ");
                        return TokenType.todoSuccess;
                    }
                }
                this.acceptSame(nextToken); // maximum length set to -1, to consume arbitrary number of "-" tokens
                return TokenType.minus;
            
            // necessary for strikethrough, underline
            case "~": 
                this.acceptSame(nextToken, 2); // maximum length set to 2, either one or two tokens
                return TokenType.tilda;

            // necessary for italic, bold, italic-bold
            case "_": 
                this.acceptSame(nextToken, 2); // maximum length set to 2
                return TokenType.underline;

            // --------
            // indentation controller: either space or tab
            // --------
            // either a space or a tab: if a tab, we replace it with a space
            // necessary for indentation
            case " ": case "\t":
                this.acceptSame(nextToken); // arbitrary length of indentations
                return TokenType.space;
            
            // --------
            // special blocks controller: code, latex, reference, urls, headers
            // --------
            // code blocks: ` *1 or ` *3
            // latex: $ *1 or $ *2
            // reference: > *1
            // urls: []()! symbols
            // headers: # 1~6
            // necessary for code blocks: will span up to 3 so accept 1, 2, 3 chars
            case "`":
                this.acceptSame(nextToken, 3);
                return TokenType.backtick;

            // necessary for inline & block latex: will either be 1 or 2 chars
            case "$":
                this.acceptSame(nextToken, 2);
                return TokenType.dollar;
            
            // reference block, only 1 char
            case ">":
                this.acceptIt();
                return TokenType.ge;
            
            // header: up to 6 chars
            case "#": 
                this.acceptSame(nextToken, 6);
                return TokenType.hashtag;

            // left & right bracket: only appear once
            case "[":
                this.acceptIt();
                return TokenType.lsquare;
            case "]":
                this.acceptIt();
                return TokenType.rsquare;

            // left & right parenthesis: only appear once
            case "(": 
                this.acceptIt();
                return TokenType.lparen;
            case ")":
                this.acceptIt();
                return TokenType.rparen;

            // exclamation: only appear once
            case "!":
                this.acceptIt();
                if (this.peekNext() == "[") {
                    this.acceptIt();
                    return TokenType.imageSt;
                }
                return TokenType.word;

            // --------
            // special characters
            // --------
            // translate \\ for translating character

            // necessary for escaping text: consume it, not accept it, and accept the next character as a word
            case "\\": 
                this.consumeIt();
                this.acceptIt();
                return TokenType.word;
            
            // --------
            // Ordinary characters
            // --------
            // numbers and all other characters
            // number constructor: construct numbers
            case "1": case "2": case "3": case "4": case "5":
            case "6": case "7": case "8": case "9": case "0":
                while (!this.eof && (this.peekNext() == "1" || this.peekNext() == "2" || this.peekNext() == "3" || this.peekNext() == "4" || 
                        this.peekNext() == "5" || this.peekNext() == "6" || this.peekNext() == "7" || 
                        this.peekNext() == "8" || this.peekNext() == "9" || this.peekNext() == "0")) {
                    this.acceptIt();
                }
                if (this.peekNext() == ".") {
                    this.acceptIt();
                    return TokenType.number;
                } else {
                    return TokenType.word;
                }

            // string constructor: while the next character is not special: we accept it
            default:
                while (!this.eof && specials.indexOf(this.peekNext()) < 0) {
                    this.acceptIt();
                }
                return TokenType.word;
        }
    };

    // consume a character, not append it
    // Internal
    this.consumeIt = function() {
        this.cursor += 1;
        this.eof = this.cursor >= this.maxlen;
    }

    this.remain = function(chars)  {
        return (chars + this.cursor) < this.maxlen;
    }

    // accept one token at a step
    // Internal
    let word;
    this.acceptIt = function() {
        word  = this.text[this.cursor];
        // replace tab item with four spaces
        if (word == "\t") { word = "    "; }
        // append it to current token
        this.currentToken += word;
        this.cursor += 1;
        this.eof = this.cursor >= this.maxlen;
    };

    // check if the next token is compatible with a given token
    // Internal
    this.compatible = function(food) {
        // \t is compatible with space
        // else: all other tokens only compatible when they are of the same type
        if (food == " " || food == "\t") return this.peekNext() == " " || this.peekNext() == "\t";
        else return food == this.peekNext();
    }

    // accept a sequence of same tokens, with specified maximum length
    // Internal
    this.acceptSame = function(food, maxlength=-1) {
        if (maxlength < 0) {
            while (!this.eof && this.compatible(food)) {
                this.acceptIt();
            }
        }
        else {
            while (!this.eof && this.compatible(food) && maxlength > 0) {
                this.acceptIt();
                maxlength -= 1;
            }
        }
    }

    // peek the next token from the text
    // Internal
    this.peekNext = function() {
        return this.text[this.cursor];
    }

};

// exports:
//      Lexer object
//      Token object
//      TokenType enumerator
//      specials enumerator
// let Lex = { Lexer, Token, TokenType, specials };
// export default Lex;
exports.Lexer = Lexer;
exports.Token = Token;
exports.TokenType = TokenType;
exports.KEYWORDS = specials;