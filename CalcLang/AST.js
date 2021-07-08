let {SourcePosition, TokenType} = require("./lexer");


let ASTType = {
    AST: 0, 

    Program: 1, 

    Statement: 2, 
    EvalStmt: 3, 
    AssignStmt: 4, 
    IdxAssignStmt: 5, 
    BlockStmt: 6, 
    IfElseStmt: 7, 
    ForStmt: 8, 
    WhileStmt: 9, 
    ReturnStmt: 10, 

    Expression: 11, 
    RefExpr: 12, 
    CallExpr: 13, 
    IdxExpr: 14, 
    BinaryExpr: 15, 
    UnaryExpr: 16, 
    DefinitionExpr: 17, 

    Definition: 18, 
    ObjectDef: 19, 
    ArrayDef: 20, 
    FunctionDef: 21, 
    LiteralDef: 22, 
    ParameterDef: 23, 
    ObjectPropertyDef: 24, 

    Reference: 25, 
    BaseRef: 26, 
    QualRef: 27, 
    ThisRef: 28, 

    Leaf: 29, 
    Operator: 30, 
    String: 31, 
    Int: 32, 
    Float: 33, 
    Boolean: 34, 
    Null: 35, 
    Identifier: 36,

    finder: (type) => { for (let item in ASTType) { if (ASTType[item] == type) return item; } },
}
exports.ASTType = ASTType;

// ------------------------
//
// AST Container - ASTList
//
// ------------------------

class ASTList {
    constructor() {
        this.children = [];
    }

    push(child) {
        this.children.push(child);
    }
    get length() {
        return this.children.length;
    }
}

ASTList.prototype.forEach = function(fn) { this.children.forEach(fn); };
exports.ASTList = ASTList;

// ------------------------
//
// General AST
//
// ------------------------

class AST {
    /**
     * 
     * @param {ASTType} type 
     * @param {SourcePosition} posn 
     */
    constructor(type=ASTType.AST, posn=undefined) {
        this.type = type;
        this.posn = posn;
    }

    get name() {
        return ASTType.finder(this.type);
    }

    get stringify() {
        return `${this.name}${this.posn?'@'+this.posn.stringify:''}`;
    }

    visit(visitor, args) {
        return visitor['visit'+this.name](this, args);
    }
}

// ------------------------
//
// Program
//
// ------------------------

class Program extends AST {
    constructor(stmtlist, posn=undefined) {
        super(ASTType.Program, posn);
        this.children = stmtlist;
    }
    
    get stringify() {
        return super.stringify + `: Statement[${this.children.length}]`;
    }
}
exports.Program = Program;

// ------------------------
//
// Statement
//
// ------------------------

class Statement extends AST {
    constructor(type=ASTType.Statement, posn=undefined) {
        super(type, posn);
    }
}

class EvalStmt extends Statement {
    constructor(expr, posn=undefined) {
        super(ASTType.EvalStmt, posn);
        this.expr = expr;
    }
}
exports.EvalStmt = EvalStmt;

class AssignStmt extends Statement {
    constructor(ref, expr, posn=undefined) {
        super(ASTType.AssignStmt, posn);
        this.ref = ref;
        this.expr = expr;
    }
}
exports.AssignStmt = AssignStmt;

class IdxAssignStmt extends Statement {
    constructor(ref, idx, expr, posn=undefined) {
        super(ASTType.IdxAssignStmt, posn);
        this.ref = ref;
        this.idx = idx;
        this.expr = expr;
    }
}
exports.IdxAssignStmt = IdxAssignStmt;

class BlockStmt extends Statement {
    constructor(stmtlist, posn=undefined) {
        super(ASTType.BlockStmt, posn);
        this.children = stmtlist;
    }

    get stringify() {
        return super.stringify + `: Statement[${this.children.length}]`;
    }
}
exports.BlockStmt = BlockStmt;

class IfElseStmt extends Statement {
    constructor(condition, ifblock, elseblock=undefined, posn=undefined) {
        super(ASTType.IfElseStmt, posn);
        this.cond = condition;
        this.ifblock = ifblock;
        this.elseblock = elseblock;
    }
}
exports.IfElseStmt = IfElseStmt;

class ForStmt extends Statement {
    constructor(varname, iterexpr, stmt, posn=undefined) {
        super(ASTType.ForStmt, posn);
        this.varname = varname;
        this.iterexpr = iterexpr;
        this.stmt = stmt;
    }
}
exports.ForStmt = ForStmt;

class WhileStmt extends Statement {
    constructor(cond, stmt, posn=undefined) {
        super(ASTType.WhileStmt, posn);
        this.cond = cond;
        this.stmt = stmt;
    }
}
exports.WhileStmt = WhileStmt;

class ReturnStmt extends Statement {
    constructor(retexpr=undefined, posn=undefined) {
        super(ASTType.ReturnStmt, posn);
        this.retexpr = retexpr;
    }

    get stringify() {
        return super.stringify + `: Return[${this.retexpr?1:0}]`;
    }
}
exports.ReturnStmt = ReturnStmt;

// ------------------------
//
// Expression
//
// ------------------------

class Expression extends AST {
    constructor(type=ASTType.Expression, posn=undefined) {
        super(type, posn);
    }
}

class RefExpr extends Expression {
    constructor(ref, posn=undefined) {
        super(ASTType.RefExpr, posn);
        this.ref = ref;
    }
}
exports.RefExpr = RefExpr;

class CallExpr extends Expression {
    constructor(ref, arglist=undefined, posn=undefined) {
        super(ASTType.CallExpr, posn);
        this.ref = ref;
        this.arglist = arglist;
    }

    get stringify() {
        return super.stringify + `: Argument[${this.arglist?this.arglist.length:0}]`;
    }
}
exports.CallExpr = CallExpr;

class IdxExpr extends Expression {
    constructor(ref, idx, posn=undefined) {
        super(ASTType.IdxExpr, posn);
        this.ref = ref;
        this.idx = idx;
    }
}
exports.IdxExpr = IdxExpr;

class BinaryExpr extends Expression {
    constructor(lhs, op, rhs, posn) {
        super(ASTType.BinaryExpr, posn);
        this.lhs=lhs;
        this.op=op;
        this.rhs=rhs;
    }
}
exports.BinaryExpr = BinaryExpr;

class UnaryExpr extends Expression {
    constructor(op, target, posn) {
        super(ASTType.UnaryExpr, posn);
        this.op = op;
        this.target = target;
    }
}
exports.UnaryExpr = UnaryExpr;

class DefinitionExpr extends Expression {
    constructor(def, posn) {
        super(ASTType.DefinitionExpr, posn);
        this.definition = def;
    }
}
exports.DefinitionExpr = DefinitionExpr;

// ------------------------
//
// Definition
//
// ------------------------

class Definition extends AST {
    constructor(type=ASTType.Definition, posn=undefined) {
        super(type, posn);
    }
}

class ObjectDef extends Definition {
    constructor(proplist, posn) {
        super(ASTType.ObjectDef, posn);
        this.proplist = proplist;
    }

    get stringify() {
        return super.stringify + `: Prop[${this.proplist.length}]`;
    }
}
exports.ObjectDef = ObjectDef;

class ArrayDef extends Definition {
    constructor(exprs, posn) {
        super(ASTType.ArrayDef, posn);
        this.exprs = exprs;
    }

    get stringify() {
        return super.stringify + `: Elemenet[${this.exprs.length}]`;
    }
}
exports.ArrayDef = ArrayDef;

class FunctionDef extends Definition {
    constructor(stmt, paramlist=undefined, posn=undefined) {
        super(ASTType.FunctionDef, posn);
        this.stmt = stmt;
        this.paramlist = paramlist;
    }

    get stringify() {
        return super.stringify + `: Parameter[${this.paramlist?this.paramlist.length:0}]`;
    }
}
exports.FunctionDef = FunctionDef;

class LiteralDef extends Definition {
    constructor(literal, posn) {
        super(ASTType.LiteralDef, posn);
        this.literal = literal;
    }
}
exports.LiteralDef = LiteralDef;

class ParameterDef extends Definition {
    constructor(paramid, defaultval=undefined, posn=undefined) {
        super(ASTType.ParameterDef, posn);
        this.identifier = paramid;
        this.defaultval = defaultval;
    }
}
exports.ParameterDef = ParameterDef;

class ObjectPropertyDef extends Definition {
    constructor(key, value, posn) {
        super(ASTType.ObjectPropertyDef, posn);
        this.key = key;
        this.value = value;
    }
}
exports.ObjectPropertyDef = ObjectPropertyDef;

// ------------------------
//
// Reference
//
// ------------------------

class Reference extends AST {
    constructor(type=ASTType.Reference, posn=undefined) {
        super(type, posn);
    }
}

class BaseRef extends Reference {
    constructor(id, posn) {
        super(ASTType.BaseRef, posn);
        this.id = id;
        this.qualref = undefined;
    }
}
exports.BaseRef = BaseRef;

class QualRef extends Reference {
    constructor(id, baseref, posn) {
        super(ASTType.QualRef, posn);
        this.id = id;
        baseref.qualref = this;
        this.qualref = undefined;
    }
}
exports.QualRef = QualRef;

class ThisRef extends Reference {
    constructor(posn) {
        super(ASTType.ThisRef, posn);
        this.qualref = undefined;
    }
}
exports.ThisRef = ThisRef;

// ------------------------
//
// Leaf Nodes: Operators, Strings, Ints, Floats, Booleans, Null, and Identifier
//
// ------------------------
class Leaf extends AST {
    constructor(token, type=ASTType.Leaf, posn=undefined) {
        super(type, posn);
        this.token = token;
    }

    get content() {
        return this.token.content;
    }

    get tokentype() {
        return this.token.type;
    }
}

class Operator extends Leaf {
    constructor(op, posn) {
        super(op, ASTType.Operator, posn);
    }
    get stringify() {
        return super.stringify + `: ${TokenType.finder(this.tokentype)}(${this.content})`;
    }
}
exports.Operator = Operator;

class CalcString extends Leaf {
    constructor(token, posn) {
        super(token, ASTType.String, posn);
    }

    get stringify() {
        return super.stringify + `: String(${this.content})`;
    }
}
exports.CalcString = CalcString;

class CalcInt extends Leaf {
    constructor(token, posn) {
        super(token, ASTType.Int, posn);
    }

    get stringify() {
        return super.stringify + `: Integer(${this.content})`;
    }
}
exports.CalcInt = CalcInt;

class CalcFloat extends Leaf {
    constructor(token, posn) {
        super(token, ASTType.Float, posn);        
    }

    get stringify() {
        return super.stringify + `: Float(${this.content})`;
    }
}
exports.CalcFloat = CalcFloat;

class CalcBool extends Leaf {
    constructor(token, posn) {
        super(token, ASTType.Boolean, posn);
    }

    get stringify() {
        return super.stringify + `: Boolean(${this.content})`;
    }
}
exports.CalcBool = CalcBool;

class CalcNull extends Leaf {
    constructor(token, posn) {
        super(token, ASTType.Null, posn);
    }

    get stringify() {
        return super.stringify + `: Null`;
    }
}
exports.CalcNull = CalcNull;

class Identifier extends Leaf {
    constructor(token, posn) {
        super(token, ASTType.Identifier, posn);
    }

    get stringify() {
        return super.stringify + `: ${this.content}`;
    }
}
exports.Identifier = Identifier;


let a = new BlockStmt(new ASTList(), undefined);
// let Vis = require("./Visitor").Visitor;
// let v = new Vis();
// a.visit(v, undefined);
// console.log(a.stringify);


// for (item in ASTType) {
//     console.log(`visit${item}() { \n// TODO: Unimplemented Method\nreport(); \n}`);
// }

counter = 0;
for (item in ASTType) {
    console.log(`${item}: ${counter++}, `);
}