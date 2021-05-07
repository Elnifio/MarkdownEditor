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
let specials = ["\\", "$", "`", "#", "-", "[", "]", ">", " ", "_", "*", "~", "."];

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
    lsquare     : 9,    // left square  - used for todos (- [ ])
    rsquare     : 10,   // right square - used for todos
    ge          : 11,   // right arrow  - used for references
    underline   : 12,   // underline    - used in styles
    tilda       : 13,   // tilda        - used in styles
    period      : 14,   // period       - used with number to denote ordered list
};

// locks the enumeration
Object.freeze(TokenType);

// Token object: (type, content) tuple
let Token = function(type, content) {
    this.type = type;
    this.content = content;
};

//  Lexer object: 
//      call lexer.init to reset a lexer
//      call lexer.yield to yield the next token
let Lexer = function() {
    // initiate the lexer status
    this.text = text;
    this.cursor = 0;
    this.eof = false;
    this.currentToken = "";

    // initialization
    this.init = function(text) {
        // initiate the lexer status
        this.text = text;
        this.cursor = 0;
        this.eof = false;
        this.currentToken = "";
    };

    // yield one token at a time
    this.yield = function() {
        this.currentToken = "";
        let type = this.scantoken();
        return new Token(this.currentToken, type);
    };

    // scan token based on next token: 
    //     returns the token type
    this.scantoken = function() {
        let nextToken = this.peekNext();

    };

    // accept one token at a step
    this.acceptIt = function() {
        this.currentToken += this.text[this.cursor];
        this.cursor += 1;
    };

    // peek the next token from the text
    this.peekNext = function() {
        return this.text[cursor];
    }
};

// exports:
//      Lexer object
//      Token object
//      TokenType enumerator
//      specials enumerator
let Lex = { Lexer, Token, TokenType, specials };
export default Lex;