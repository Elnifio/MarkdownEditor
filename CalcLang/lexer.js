let TokenType = {
    // Special summary operators
    BinaryOperator: -2, 
    UnaryOperator: -3,

    // Error
    error: -1,

    // EOF
    eof: 0,

    // Basic Types
    // Numbers
    int:    1,
    float:  2,
    // Booleans
    true:   3,
    false:  4,
    // Strings
    string: 5,

    // Operations
    // Arithmetic: 
    Plus:   6,
    Minus:  7,
    Times:  8,
    Divide: 9,
    Power:  10,
    Root:   11,
    // Boolean: 
    And:    12,
    Or:     13,
    Not:    14, 
    // Comparisons:
    Greater:16,
    Smaller:17,
    GE:     18,
    SE:     19, 
    Equal:  20,
    NE:     21,

    // Variables
    id:     22,
    Assign: 23, 

    // Objects Types
    // Definition
    lbrace: 24,
    rbrace: 25,
    colon:  26,
    // Reference
    period: 27,

    // List Types
    // Definition, Reference
    lsquare:28,
    rsquare:29,
    comma:  30,

    // Function Types
    // Definition
    fn:     31,
    lparen: 32,
    rparen: 33,
    // { } already defined
    // Call
    // id ( ) already defined

    // Flow Control
    // if-else
    if:     34,
    else:   35,
    // ( ) { } already defined
    // while
    while:  36,
    // ( ) { } already defined
    // for
    for:    37, 
    in:     38,
    // ( ) { } already defined
    // Return
    return: 39,

    // Special keywords
    this:   40,
    semicol:41,
    null:   42,
    comment:43,

    

    finder: (type) => { for (let item in TokenType) { if (TokenType[item] == type) return item; } },
}
exports.TokenType = TokenType;

class SourcePosition {
    constructor(line, position, index) {
        this.line = line;
        this.index = index;
        this.posn = position;
    }

    get stringify() {
        return `line${this.line}; position${this.posn}; index${this.index};`;
    }
}
exports.SourcePosition = SourcePosition;

// Token object: (type, content) tuple
/**
 * 
 * @param {TokenType} type TokenType enum: type of the token
 * @param {String} content String: Content of the token
 */
let Token = function(type, content, line=-1, pos=-1, index=-1) { 
    this.type = type; 
    this.content = content;
    this.position = new SourcePosition(line, pos, index);

    // debug use
    this.literalType = TokenType.finder(this.type);

    this.toString = function() {
        return `${this.literalType}: "${this.content}@${this.position.stringify}"`;
    }
};
exports.Token = Token;

let ScanError = function(msg) {
    this.name = "Scan Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

let Lexer = function() {
    this.text = "";
    this.counter = 0;
    this.eof = false;
    this.builder = "";
    this.maxlen = this.text.length;
    this.reporter = [];

    this.init = (newinput) => {
        this.text = newinput;
        this.counter = 0;
        this.eof = false;
        this.builder = "";
        this.maxlen = this.text.length;
        this.reporter = [];
    }

    this.yield = () => {
        if (!this.eof) {
            while (!this.eof && this.isSpace(this.peekNext())) {
                this.skipIt();
            }
            this.builder = "";
            let type = this.scantoken();
            return new Token(type, this.builder);
        } else {
            return new Token(TokenType.eof, "");
        }
    }

    this.scantoken = () => {
        if (this.eof) return TokenType.eof;

        switch(this.peekNext()) {
            // Operations
            // Arithmetics
            case "+":
                this.takeIt();
                return TokenType.Plus;
            case "-":
                this.takeIt();
                return TokenType.Minus;
            case "*":
                this.takeIt();
                return TokenType.Times;
            case "/":
                this.takeIt();
                return TokenType.Divide;
            case "^":
                this.takeIt();
                return TokenType.Power;
            case "~":
                this.takeIt();
                return TokenType.Root;
            
            // Boolean
            case "&":
                this.takeIt();
                return TokenType.And;
            case "|":
                this.takeIt();
                return TokenType.Or;
            case "!":
                this.takeIt();
                if (this.peekNext() == "=") {
                    this.takeIt();
                    return TokenType.NE;
                } else {
                    return TokenType.Not;
                }

            // Comparisons
            case ">":
                this.takeIt();
                if (this.peekNext() == "=") {
                    this.takeIt();
                    return TokenType.GE;
                } else {
                    return TokenType.Greater;
                }
            case "<":
                this.takeIt();
                if (this.peekNext() == "=") {
                    this.takeIt();
                    return TokenType.SE;
                } else {
                    return TokenType.Smaller;
                }
            case "=":
                this.takeIt();
                if (this.peekNext() == "=") {
                    this.takeIt();
                    return TokenType.Equal;
                } else {
                    return TokenType.Assign;
                }

            // Complex Type Definition
            case "{":
                this.takeIt();
                return TokenType.lbrace;
            case "}":
                this.takeIt();
                return TokenType.rbrace;
            case "[":
                this.takeIt();
                return TokenType.lsquare;
            case "]":
                this.takeIt();
                return TokenType.rsquare;
            case "(":
                this.takeIt();
                return TokenType.lparen;
            case ")":
                this.takeIt();
                return TokenType.rparen;
            case ",":
                this.takeIt();
                return TokenType.comma;
            case ".":
                this.takeIt();
                if (this.isDigit(this.peekNext())) {
                    while (!this.eof && this.isDigit(this.peekNext())) {
                        this.takeIt();
                    }
                    return TokenType.float;
                } else {
                    return TokenType.period;
                }
            case ":":
                this.takeIt();
                return TokenType.colon;
            case ";":
                this.takeIt();
                return TokenType.semicol;

            // Basic Types
            case '"':
            case "'":
                let starter = this.peekNext();
                this.takeIt();
                while (!this.eof) {
                    if (this.peekNext() == starter) {
                        this.takeIt();
                        return TokenType.string;
                    } else if (this.isEnter()) {
                        this.error("String not properly closed: Unexpected End-of-Line");
                        return TokenType.string;
                    } else {
                        this.takeIt();
                    }
                }
                this.error("EOF: String not properly closed: Unexpected End-of-File");
                return TokenType.string;
            
            case '0': case '1': case '2': case '3': case '4': 
            case '5': case '6': case '7': case '8': case '9': 
                while (!this.eof && this.isDigit(this.peekNext())) {
                    this.takeIt();
                }

                if (this.peekNext() == ".") {
                    this.takeIt();
                    while (!this.eof && this.isDigit(this.peekNext())) {
                        this.takeIt();
                    }
                    return TokenType.float;
                } else {
                    return TokenType.int;
                }

            // Comments
            case "#":
                this.takeIt();
                while (!this.eof && !this.isEnter(this.peekNext())) {
                    this.takeIt();
                }
                return TokenType.comment;
            
            default: 
                if (this.isIDStarter(this.peekNext())) {
                    this.takeIt();
                    while (this.isIDChar(this.peekNext())) {
                        this.takeIt();
                    }
                    return this.nameOrKeyword();
                } else {
                    this.takeIt();
                    this.error("Unrecognized character: " + this.peekNext());
                    return TokenType.error;
                }
        }
    }

    this.error = function(msg) {
        let err = new ScanError(msg)
        this.reporter.push(err);
        throw err;
    }

    this.hasError = function() {
        return this.reporter.length != 0;
    }

    this.provideError = function() {
        return this.reporter;
    }

    this.peekNext = function() {
        return this.text[this.counter];
    }

    this.takeIt = function() {
        this.builder += this.text[this.counter];
        this.readNext();
    }

    this.skipIt = function() {
        this.readNext();
    }

    this.readNext = function() {
        this.counter += 1;
        if (this.counter >= this.maxlen) {
            this.eof = true;
        }
    }

    this.isDigit = function(c) {
        return (c <= "9" && c >= "0");
    }

    this.isIDStarter = function(c) {
        return (c <= "z" && c >= "a") || (c <= "Z" && c >= "A");
    }

    this.isIDChar = function(c) {
        return (this.isIDStarter(c)) || (this.isDigit(c));
    }

    this.isSpace = function(c) {
        return c==" " || c=="\n" || c=="\t" || c=="\r";
    }

    this.isEnter = function(c) {
        return c=="\n"||c=="\r";
    }

    this.nameOrKeyword = function() {
        switch(this.builder) {
            case "fn":
                return TokenType.fn;
            case "if":
                return TokenType.if;
            case "else":
                return TokenType.else;
            case "while":
                return TokenType.while;
            case "for":
                return TokenType.for;
            case "in":
                return TokenType.in;
            case "return":
                return TokenType.return;
            case "this":
                return TokenType.this;
            case "null":
                return TokenType.null;
            case "true":
                return TokenType.true;
            case "false":
                return TokenType.false;
            default: 
                return TokenType.id;
        }
    }
}
exports.Lexer = Lexer;