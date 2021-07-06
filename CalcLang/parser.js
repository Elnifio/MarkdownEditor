/**
 * Analysis of Grammar:
 */
let Lexer = require("./lexer");
let TokenType = Lexer.TokenType;
let AST = require("./AST");


/**
 * Definitions Starter
 *          = St(Object) U St(Array) U St(Function) U St(Literal)
 *          = { lbrace } U { lsquare } U { fn } U { string, int, float, true, false, null }
 */
let __definitions = [   TokenType.lbrace, TokenType.lsquare, TokenType.fn, 
                        TokenType.string, TokenType.int, TokenType.float, 
                        TokenType.true, TokenType.false, TokenType.null];

/**
 * Reference Starter
 *          = { id, this }
 */
let __reference = [ TokenType.id, TokenType.this ];

/**
 * Expression Starter
 *          = St(Reference) U { lparen } U St(UnaryOperator) U St(Definitions)
 *          = { id, this } U { lparen } U 
 *              { not, minus } U { lbrace } U { lsquare } U { fn } U { string, int, float, true, false, null }
 */
let __expression = Array.from(
    new Set(
        __reference.concat(
            __definitions, [ TokenType.lparen, TokenType.Not, TokenType.Minus ]
            )));
/**
 * Statement Starter 
 *      = St(EvalStmt) U St(AssignStmt) U St(Ifelse) U St(For) U St(While) U St(Return) U St(Block)
 *      = St(Expression) U St(Reference) U { if } U { for } U { while } U { return }
 */
let __statement = Array.from(
    new Set(
        __expression.concat(
            __reference, [TokenType.if, TokenType.for, TokenType.while, TokenType.return]
            )));

let Starter = {
    Definitions: __definitions,
    Reference: __reference, 
    Expression: __expression,
    Statement: __statement
}

let VisualizeStarter = (opt) => {
    console.log(opt + ": " + Starter[opt].map(x => TokenType.finder(x)).reduce((accu, curr) => accu + ", " + curr));
}

let ParseError = function(msg) {
    this.name = "Parse Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

let __ID_EXPRESSION_FOLLOWER = [TokenType.semicol, TokenType.lparen, TokenType.lsquare, TokenType.period, TokenType.Assign];

let stack = [];
let debug = true;
let VisualizeStack = (prefix = " | ") => {
    stack.forEach(x => console.log(prefix + x));
}

let PushStack = (expected) => {
    console.log(`Pushing ${expected} to stack`);
    stack.push(expected);
}

let PopStack = (expected) => {
    console.log(`Expecting ${expected} to be popped: ${stack.pop()}`);
}

let log = (x) => console.log(x);

let Parser = function() {
    this.lexer = new Lexer.Lexer();
    this.reporter = [];
    this.curr = undefined;
    this.history = [];

    this.init = (newinput) => {
        this.lexer.init(newinput);
        this.reporter = [];
        this.curr = undefined;
    }

    this.parse = (newinput) => {
        this.init(newinput);
        this.nextToken();
        try {
            let out = this.parseProgram();
            if (debug) console.log("\n--------\nParsing success\n--------");
            return out;
        } catch (e) {
            console.log("--------\nERROR\n--------");
            console.log(e.toString());
        }

    }

    // ------------------------
    //
    // Program
    //
    // ------------------------

    this.parseProgram = () => {
        PushStack("Program");
        log(`${TokenType.finder(this.curr.type)}: in: ${this.in(Starter.Statement)}`);

        let stmts = new AST.ASTList();
        let prog = new AST.Program(stmts, this.locate());

        while (this.in(Starter.Statement)) {
            stmts.push(this.parseStatement());
        }
        this.accept(TokenType.eof);
        
        PopStack("Program");
        return prog;
    }

    // ------------------------
    //
    // Statement
    //
    // ------------------------

    this.parseStatement = () => {
        PushStack("Statement");
        let position;
        // Statement Starter: 
        switch(this.curr.type) {
            // if block
            case TokenType.if:
                position = this.locate();
                this.acceptIt();
                this.accept(TokenType.lparen);
                let ifcond = this.parseExpression(); // Condition expression
                this.accept(TokenType.rparen);
                let evalstmt = this.parseStatement(); // evaluation statement
                // else block
                let elsestmt = undefined;
                if (this.is(TokenType.else)) {
                    this.acceptIt();
                    elsestmt = this.parseStatement();
                }
                PopStack("Statement");
                return new AST.IfElseStmt(ifcond, evalstmt, elsestmt, position);
            
            // for block
            case TokenType.for:
                position = this.locate();
                this.acceptIt();
                this.accept(TokenType.lparen);
                let varname = new AST.Identifier(this.curr, this.locate());
                this.accept(TokenType.id); // Loop-variable name
                this.accept(TokenType.in);
                let iterexpr = this.parseExpression(); // Iterator
                this.accept(TokenType.rparen);
                let forbody = this.parseStatement(); // for loop body
                PopStack("Statement");
                return new AST.ForStmt(varname, iterexpr, forbody, position);

            // while block
            case TokenType.while:
                position = this.locate();
                this.acceptIt();
                this.accept(TokenType.lparen);
                let whilecond = this.parseExpression();
                this.accept(TokenType.rparen);
                let whilebody = this.parseStatement();
                PopStack("Statement");
                return new AST.WhileStmt(whilecond, whilebody, position);

            // return block
            case TokenType.return:
                position = this.locate();
                this.acceptIt();
                let retexpr = undefined;
                if (this.in(Starter.Expression)) {
                    retexpr = this.parseExpression();
                }
                this.accept(TokenType.semicol);
                PopStack("Statement");
                return new AST.ReturnStmt(retexpr, position);
            
            // Block Statement OR ObjectDefinition, inside Expression
            case TokenType.lbrace:
                position = this.locate();
                this.acceptIt();
                // either a Object definition or a block statement
                if (this.is(TokenType.id)) {
                    this.memorizeIt();

                    // object definition
                    // is a expression, so we should accept a semicolon
                    if (this.is(TokenType.colon)) {
                        this.recallFromMemory();
                        let objdef = this.parseObjectDefinition();
                        this.accept(TokenType.rbrace);
                        this.accept(TokenType.semicol);
                        let objdefn = new AST.ObjectDef(objdef, position);
                        let defexpr = new AST.DefinitionExpr(objdefn, position);
                        PopStack("Statement");
                        return new AST.EvalStmt(defexpr, position);
                    } else 
                    
                    // Normal statement
                    if (this.in(__ID_EXPRESSION_FOLLOWER)) {
                        this.recallFromMemory();
                        let stmts = new AST.ASTList();
                        let blocks = new AST.BlockStmt(stmts, position);
                        while (this.in(Starter.Statement)) {
                            stmts.push(this.parseStatement());
                        }
                        this.accept(TokenType.rbrace);
                        PopStack("Statement");
                        return blocks;
                    } else {
                        this.error("Unexpected Follower after { id ");
                    }
                } else {
                    let stmts = new AST.ASTList();
                    let blocks = new AST.BlockStmt(stmts, position);
                    while (this.in(Starter.Statement)) {
                        stmts.push(this.parseStatement());
                    }
                    this.accept(TokenType.rbrace);
                    PopStack("Statement");
                    return blocks;
                }
                
            /**
             * Evaluation and Assignment Statement:
             *      Evaluation statement := Expression ;
             *      Assignment statement := Reference ([ Expression ])? = Expression ;
             *  
             *  They share starter for Reference
             */
            case TokenType.Not: case TokenType.Minus: case TokenType.lparen:
            case TokenType.lsquare: case TokenType.fn: case TokenType.string: 
            case TokenType.int: case TokenType.float: case TokenType.true:
            case TokenType.false: case TokenType.null:
                position = this.locate();
                let expr = this.parseExpression();
                PopStack("Statement");
                return new AST.EvalStmt(expr, position);
            
            // reference starter is id or this
            case TokenType.id: case TokenType.this:
                position = this.locate();
                let ref = this.parseReference();
                // Reference = Expression ;
                if (this.is(TokenType.Assign)) {
                    this.acceptIt();
                    let rhs = this.parseExpression();
                    this.accept(TokenType.semicol);
                    PopStack("Statement");
                    return new AST.AssignStmt(ref, rhs, position);
                } else 

                // Reference ( Arg-list? ) ;
                if (this.is(TokenType.lparen)) {
                    this.acceptIt();
                    // Arglist starter is the same as expression starter
                    let arglist = undefined;
                    if (this.in(Starter.Expression)) {
                        arglist = this.parseArgList();
                    }
                    this.accept(TokenType.rparen);
                    this.accept(TokenType.semicol);
                    PopStack("Statement");
                    return new AST.EvalStmt(new AST.CallExpr(ref, arglist, position), position);
                } else 

                // Reference ;
                if (this.is(TokenType.semicol)) {
                    this.acceptIt();
                    PopStack("Statement");
                    return new AST.EvalStmt(new AST.RefExpr(ref, position), position);
                } else 

                // Reference [ Expression ]
                if (this.is(TokenType.lsquare)) {
                    this.acceptIt();
                    let idx = this.parseExpression();
                    this.accept(TokenType.rsquare);
                    // Reference [ Expression ] = Expression ; 
                    if (this.is(TokenType.Assign)) {
                        this.acceptIt();
                        let rhs = this.parseExpression();
                        this.accept(TokenType.semicol);
                        PopStack("Statement");
                        return new AST.IdxAssignStmt(ref, idx, rhs, position);
                    } else {
                        // Reference[ Expression ] ;
                        this.accept(TokenType.semicol);
                        PopStack("Statement");
                        return new AST.EvalStmt(new AST.IdxExpr(ref, idx, position), position);
                    }
                } else {
                    this.error("Unexpected Follower after Reference;");
                }
            default: 
                this.error("Unexpected Starter for a statement;");
        }
    }

    // ------------------------
    //
    // Expression
    //
    // ------------------------

    this.parseExpression = () => {
        PushStack("Expression:OR");
        let position = this.locate();
        let baseexpr = this.parseDisjunction();
        let oper;
        while (this.is(TokenType.Or)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            baseexpr = new AST.BinaryExpr(baseexpr, oper, this.parseDisjunction(), position);
        }
        PopStack("Expression:OR");
        return baseexpr;
    }

    this.parseDisjunction = () => {
        PushStack("Expression:AND");
        let position = this.locate();
        let expr = this.parseConjunction();
        let oper;
        while (this.is(TokenType.And)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new AST.BinaryExpr(expr, oper, this.parseConjunction(), position);
        }
        PopStack("Expression:AND");
        return expr;
    }

    this.parseConjunction = () => {
        PushStack("Expression:EQUAL & NOT-EQUAL");
        let position = this.locate();
        let expr = this.parseEqne();
        let oper;
        while (this.is(TokenType.Equal) || this.is(TokenType.NE)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new  AST.BinaryExpr(expr, oper, this.parseEqne(), position);
        }
        PopStack("Expression:EQUAL & NOT-EQUAL");
        return expr;
    }

    this.parseEqne = () => {
        PushStack("Expression:COMPARISON");
        let position = this.locate();
        let expr = this.parseGS();
        let oper;
        while (this.is(TokenType.GE) || this.is(TokenType.Greater) || this.is(TokenType.SE) || this.is(TokenType.Smaller)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new AST.BinaryExpr(expr, oper, this.parseGS(), position);
        }
        PopStack("Expression:COMPARISON");
        return expr;
    }
    
    this.parseGS = () => {
        PushStack("Expression:PLUS & MINUS");
        let position = this.locate();
        let expr = this.parsePlusMinus();
        let oper;
        while (this.is(TokenType.Plus) || this.is(TokenType.Minus)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new AST.BinaryExpr(expr, oper, this.parsePlusMinus(), position);
        }
        PopStack("Expression:PLUS & MINUS");
        return expr;
    }

    this.parsePlusMinus = () => {
        PushStack("Expression:TIMES & DIVIDE");
        let position = this.locate();
        let expr = this.parseMultDiv();
        let oper;
        while (this.is(TokenType.Times) || this.is(TokenType.Divide)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new AST.BinaryExpr(expr, oper, this.parseMultDiv(), position);
        }
        PopStack("Expression:TIMES & DIVIDE");
        return expr;
    }

    this.parseMultDiv = () => {
        PushStack("Expression:POWER & ROOT");
        let position = this.locate();
        let expr = this.parsePowerRoot();
        let oper;
        while (this.is(TokenType.Power) || this.is(TokenType.Root)) {
            oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new AST.BinaryExpr(expr, oper, this.parsePowerRoot(), position);
        }
        PopStack("Expression:POWER & ROOT");
        return expr;
    }

    this.parsePowerRoot = () => {
        PushStack("Expression:UNARY");
        let expr;
        if (this.is(TokenType.UnaryOperator)) {
            let position = this.locate();
            let oper = new AST.Operator(this.curr, this.locate());
            this.acceptIt();
            expr = new AST.UnaryExpr(oper, this.parsePowerRoot(), position);
        } else {
            expr = this.parseEUnit();
        }
        PopStack("Expression:UNARY");
        return expr;
    }

    this.parseEUnit = () => {
        PushStack("Expression:Expr Unit");
        let position = this.locate();
        switch(this.curr.type) {
            // Reference
            case TokenType.id: case TokenType.this:
                let ref = this.parseReference();
                // Reference ( Arglist? )
                if (this.is(TokenType.lparen)) {
                    this.acceptIt();
                    let arglist = undefined;
                    if (this.in(Starter.Expression)) {
                        arglist = this.parseArgList();
                    }
                    this.accept(TokenType.rparen);
                    PopStack("Expression:Expr Unit");
                    return new AST.CallExpr(ref, arglist, position);
                } else 

                // Reference [ Expression ]
                if (this.is(TokenType.lsquare)) {
                    this.acceptIt();
                    let idx = this.parseExpression();
                    this.accept(TokenType.rsquare);
                    PopStack("Expression:Expr Unit");
                    return new AST.IdxExpr(ref, idx, position);
                } else 
                
                {
                    // Reference
                    PopStack("Expression:Expr Unit");
                    return new AST.RefExpr(ref, position);
                }
            // ( Expression )
            case TokenType.lparen:
                this.acceptIt();
                let innerExpr = this.parseExpression();
                this.accept(TokenType.rparen);
                PopStack("Expression:Expr Unit");
                return innerExpr;

            case TokenType.lbrace: case TokenType.lsquare: case TokenType.fn: 
            case TokenType.string:
            case TokenType.int: case TokenType.float:
            case TokenType.true: case TokenType.false: 
            case TokenType.null:
                let def = this.parseDefinition();
                PopStack("Expression:Expr Unit");
                return new AST.DefinitionExpr(def, position);
            default: 
                this.error("Unexpected Starting of Expression;");
        }
    }

    // ------------------------
    //
    // Definition
    //
    // ------------------------

    this.parseDefinition = () => {
        PushStack("Definition");
        let position = this.locate();
        let out;
        switch(this.curr.type) {
            // Definition
            // Object Definition
            case TokenType.lbrace:
                this.acceptIt();
                let props = new AST.ASTList();
                if (this.is(TokenType.id)) {
                    props = this.parseObjectDefinition();
                }
                this.accept(TokenType.rbrace);
                PopStack("Definition");
                return new AST.ObjectDef(props, position);
            
            // Array Definition
            case TokenType.lsquare:
                this.acceptIt();
                let exprs = new AST.ASTList();
                if (this.in(Starter.Expression)) {
                    exprs.push(this.parseExpression());
                    while (this.is(TokenType.comma)) {
                        this.acceptIt();
                        exprs.push(this.parseExpression());
                    }
                }
                this.accept(TokenType.rsquare);
                PopStack("Definition");
                return new AST.ArrayDef(exprs, position);
            
            // Function Definition
            case TokenType.fn:
                this.acceptIt();
                this.accept(TokenType.lparen);
                let params = undefined;
                // TODO: Finish this
                if (this.is(TokenType.id)) {
                    params = this.parseParamList();
                }
                this.accept(TokenType.rparen);
                let body = this.parseStatement();
                PopStack("Definition");
                return new AST.FunctionDef(body, params, position);
            
            // Literal Definition
            case TokenType.string:
                out = new AST.CalcString(this.curr, position);
                this.acceptIt();
                PopStack("Definition");
                return out;

            case TokenType.int: 
                out = new AST.CalcInt(this.curr, position);
                this.acceptIt();
                PopStack("Definition");
                return out;
                
            case TokenType.float:
                out = new AST.CalcFloat(this.curr, position);
                this.acceptIt();
                PopStack("Definition");
                return out;

            case TokenType.true: case TokenType.false: 
                out = new AST.CalcBool(this.curr, position);
                this.acceptIt();
                PopStack("Definition");
                return out;
            case TokenType.null:
                out = new AST.CalcNull(this.curr, position);
                this.acceptIt();
                PopStack("Definition");
                return out;
            default: 
                this.error("Unexpected starter of Definition;");
        }
    }

    this.parseObjectDefinition = () => {
        PushStack("Object-Definition");
        let props = new AST.ASTList();
        let position = this.locate();
        let identifier = new AST.Identifier(this.curr, position);
        this.accept(TokenType.id);
        this.accept(TokenType.colon);
        let value = this.parseExpression();
        props.push(new AST.ObjectPropertyDef(identifier, value, position));
        while (this.is(TokenType.comma)) {
            this.acceptIt();
            position=this.locate();
            identifier = new AST.Identifier(this.curr, position);
            this.accept(TokenType.id);
            this.accept(TokenType.colon);
            value = this.parseExpression();
            props.push(new AST.ObjectPropertyDef(identifier, value, position));
        }
        PopStack("Object-Definition");
        return props;
    }

    // ------------------------
    //
    // Reference
    //
    // ------------------------

    this.parseReference = () => {
        PushStack("Reference");
        let position=this.locate();
        switch(this.curr.type) {
            case TokenType.id:
                let identifier = new AST.Identifier(this.curr, position);
                let idref = new AST.BaseRef(identifier, position);
                this.acceptIt();
                if (this.is(TokenType.period)) {
                    this.acceptIt();
                    this.parseReferenceTail(idref);
                }
                PopStack("Reference");
                return idref;
            case TokenType.this:
                let thisref = new AST.ThisRef(position);
                this.acceptIt();
                if (this.is(TokenType.period)) {
                    this.acceptIt();
                    this.parseReferenceTail(thisref);
                }
                PopStack("Reference");
                return thisref;
            default: 
                this.error("Unexpected Reference starter;");
        }
    }

    this.parseReferenceTail = (parentref) => {
        PushStack("Reference-Tail");
        let position = this.locate();
        let qualref = new AST.QualRef(new AST.Identifier(this.curr, position), parentref, position);
        this.accept(TokenType.id);
        if (this.is(TokenType.period)) {
            this.acceptIt();
            this.parseReferenceTail(qualref);
        }
        PopStack("Reference-Tail");
        return qualref;
    }

    // ------------------------
    //
    // Argument & Parameter
    //
    // ------------------------

    this.parseParamList = () => {
        PushStack("Parameter-List");
        let paramlist = new AST.ASTList();
        if (this.is(TokenType.id)) {
            let position = this.locate();
            let identifier = new AST.Identifier(this.curr, position);
            this.acceptIt();
            if (!this.is(TokenType.Assign)) paramlist.push(new AST.ParameterDef(identifier, undefined, position)); 
            while (this.is(TokenType.comma)) {
                this.acceptIt();
                position = this.locate();
                identifier = new AST.Identifier(this.curr, position);
                this.accept(TokenType.id);
                if (this.is(TokenType.Assign)) {
                    break;
                } else {
                    paramlist.push(new AST.ParameterDef(identifier, undefined, position));
                }
            }

            if (this.is(TokenType.Assign)) {
                this.acceptIt();
                let defaultval = this.parseExpression();
                paramlist.push(new AST.ParameterDef(identifier, defaultval, position));
                while (this.is(TokenType.comma)) {
                    this.acceptIt();
                    position = this.locate();
                    identifier = new AST.Identifier(this.curr, position);
                    this.accept(TokenType.id);
                    this.accept(TokenType.Assign);
                    defaultval = this.parseExpression();
                    paramlist.push(new AST.ParameterDef(identifier, defaultval, position));
                }
            }
            PopStack("Parameter-List");
            return paramlist;
        }
        else { this.error("Unexpected starter for Parameter"); }
    }

    this.parseArgList = () => {
        PushStack("Argument-List");
        let arglist = new AST.ASTList();
        arglist.push(this.parseExpression());
        while (this.is(TokenType.comma)) {
            this.acceptIt();
            arglist.push(this.parseExpression());
        }
        PopStack("Argument-List");
        return arglist;
    }

    // ------------------------
    // Helper Functions
    // ------------------------

    this.opType = (type) => {
        switch(type) {
            case TokenType.Minus:
                return type;
            case TokenType.Plus: case TokenType.Times: case TokenType.Divide: 
            case TokenType.Power: case TokenType.Root: case TokenType.And: 
            case TokenType.Or:  case TokenType.Greater: 
            case TokenType.Smaller: case TokenType.GE: case TokenType.SE: 
            case TokenType.Equal: case TokenType.NE:
                return TokenType.BinaryOperator;
            case TokenType.Not:
                return TokenType.UnaryOperator;
            default: 
                return type;
        }
    }

    this.is = (token) => {
        if (this.curr == null) {
            return false;
        }

        else if (token == this.curr.type) {
            return true;
        } 

        else {
            if (this.curr.type == TokenType.Minus) {
                if (token == TokenType.UnaryOperator || token == TokenType.BinaryOperator || token == TokenType.Minus) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return this.opType(this.curr.type) == token;
            }
        }
    } 

    this.in = (tokens) => {
        if (this.curr == undefined) { return false; }
        else {
            return tokens.filter(x => this.is(x)).length > 0;
        }
    }

    this.memorizeIt = () => {
        this.history.push(this.curr);
        this.acceptIt(false);
    }

    this.recallFromMemory = () => {
        this.history.push(this.curr);
        this.curr = this.history.splice(0,1)[0];
    }

    this.acceptIt = (fromHistory=true) => {
        this.accept(this.curr.type, fromHistory);
    }

    this.accept = (expected, fromHistory=true) => {
        if (debug) {
            console.log("");
            console.log(`Trying to accept Token Type ${TokenType.finder(expected)} with current Token ${this.curr?TokenType.finder(this.curr.type):'undefined'}`);
            console.log("Call Stack: ");
            VisualizeStack();
        }
        if (!this.curr) {
            this.error("Did not find the expected type: " + TokenType.finder(expected));
        } else if (this.curr.type != expected) {
            this.error("Expected " + TokenType.finder(expected) + " but found " + TokenType.finder(this.curr.type));
        } else {
            this.nextToken(fromHistory);
        }
    }
    
    this.nextToken = (fromHistory=true) => {
        if (fromHistory && this.history.length > 0) {
            this.curr = this.history.splice(0,1)[0];
            return;
        }
        this.curr = this.lexer.yield();
        while (this.curr.type == TokenType.comment) {
            this.curr = this.lexer.yield();
        }
    }

    this.error = (msg) => {
        let err = new ParseError(msg)
        this.reporter.push(err);
        throw err;
    }

    this.hasError = () => {
        return this.reporter.length != 0 || this.lexer.hasError();
    }

    this.provideError = () => {
        return this.reporter.concat(this.lexer.provideError());
    }

    this.locate = () => {
        return this.curr.position;
    }
}

exports.Parser = Parser;