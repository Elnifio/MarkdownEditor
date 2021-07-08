const AST = require("./AST");
const TokenType = require("./lexer").TokenType;

let report = () => { throw "Unimplemented method"; };

class EnvironmentError {
    constructor(msg) {
        this.msg = msg;
        this.name = "EnvironmentError"
    }

    toString() {
        return this.name + ": " + this.msg;
    }
}

class Environment {
    constructor() {
        this.envs = [];
        this.env = {};
    }

    pushScope() {
        this.envs.push(this.env);
        this.env = {};
    }

    popScope() {
        this.env = this.envs.pop();
    }

    addBinding(name, value) {
        // priorize search on current environment
        if (this.env[name]) {
            this.env[name] = value;
            return;
        }

        // if not found, search on previous environments
        let curr = this.envs.length-1;
        while (curr >= 0) {
            if (this.envs[curr][name]) {
                this.envs[curr][name] = value;
                return;
            }
            curr -= 1
        }
        // if still not found, add it in current environment
        this.env[name] = value;
    }

    lookupBinding(name) {
        // priorize search on current environment
        if (this.env[name]) { return this.env[name]; }

        // then search on previous environment
        let curr = this.envs.length-1;
        while (curr >= 0) {
            if (this.envs[curr][name]) {
                return this.envs[curr][name];
            }
            curr -= 1;
        }

        // if not found on both environment, throw error;
        throw new EnvironmentError("Identifier " + name + " not defined; ");
    }

    deleteBinding(name) {
        if (this.env[name]) {
            delete this.env[name];
        }
    }
}

// TODO: Finish this

class Visitor {
    constructor() {
        this.environment = new Environment();
    }

    report(msg, args) {
        console.log(msg);
    }

    // ------------------------
    // 
    // Program
    // 
    // ------------------------

    /**
     * 
     * @param {AST.Program} ast 
     * @param {*} args 
     */
    visitProgram(ast, args) { 
        ast.children.forEach(x => x.visit(this, args));
    }
    
    // ------------------------
    // 
    // Statements
    // 
    // ------------------------

    /**
     * 
     * @param {AST.EvalStmt} ast 
     * @param {*} args 
     */
    visitEvalStmt(ast, args) { 
        ast.expr.visit(this, args);
    }

    /**
     * 
     * @param {AST.AssignStmt} ast 
     * @param {*} args 
     */
    visitAssignStmt(ast, args) {
        if (ast.ref.type == AST.ASTType.ThisRef) this.report("Cannot Assign value to This keyword;", args); 

        let exprresult = ast.expr.visit(this, args);
        // if is reference.reference.reference...
        if (ast.ref.qualref) {
            let target = ast.ref.visit(this, args);
            target.object[target.identifier.id.content] = exprresult;
        } else {
            // single reference
            this.environment.addBinding(ast.ref.id.content, exprresult);
        }
    }

    /**
     * 
     * @param {AST.IdxAssignStmt} ast 
     * @param {*} args 
     */
    visitIdxAssignStmt(ast, args) { 
        if (ast.ref.type == AST.ASTType.ThisRef) this.report("Cannot Assign value to This keyword;", args); 

        let index = ast.idx.visit(this, args);
        let value = ast.expr.visit(this, args);
        let target, targetArray;
        if (ast.ref.qualref) {
            target = ast.ref.visit(this, args);
            targetArray = target.object[target.identifier.id.content];
            targetArray[index] = value;
        } else {
            try {
                target = this.environment.lookupBinding(ast.ref.id.content);
                target[index] = value;
            } catch (e) {
                this.report(e.toString(), args);
            }
        }
    }

    /**
     * 
     * @param {AST.BlockStmt} ast 
     * @param {*} args 
     */
    visitBlockStmt(ast, args) { 
        this.environment.pushScope();
        ast.children.forEach(x => {
            if (x.type == AST.ASTType.ReturnStmt) {
                return x.visit(this, args);
            } else {
                x.visit(this, args);
            }
        });
        this.environment.popScope();
    }

    /**
     * 
     * @param {AST.IfElseStmt} ast 
     * @param {*} args 
     */
    visitIfElseStmt(ast, args) { 
        let condition = ast.cond.visit(this, args);
        if (condition === true) {
            ast.ifblock.visit(this, args);
        } else if (condition === false) {
            ast.elseblock.visit(this, args);
        } else {
            this.report("Unexpected Condition: " + condition);
        } 
    }

    /**
     * 
     * @param {AST.ForStmt} ast 
     * @param {*} args 
     */
    visitForStmt(ast, args) { 
        let iterator = ast.iterexpr.visit(this, args);

        // check if iterator object contains next(), hasNext() and resetIter()
        ["next", "hasNext", "resetIter"].forEach(x => {
            if (! iterator[x]) {
                this.report(`${x}() method not defined on current object`, args);
            } else {
                if ((!iterator[x]) || iterator[x].type != AST.ASTType.FunctionDef) {
                    this.report(`${x} property should be a method`, args);
                }
                if (iterator[x].paramlist) {
                    iterator[x].paramlist.forEach(param => {
                        if (!param.defaultval) {
                            this.report(`${x}() method should not contain any required argument`, args);
                        }
                    })
                }
            }
        })

        iterator['resetIter'].visit(this, args);

        let nextResult;
        this.environment.pushScope();
        while (iterator["hasNext"].visit(this, args) === true) {
            nextResult = iterator["next"].visit(this, args);
            this.environment.addBinding(ast.varname.content, nextResult);
            ast.stmt.visit(this, args);
        }
        this.environment.popScope();
    }

    /**
     * 
     * @param {AST.WhileStmt} ast 
     * @param {*} args 
     */
    visitWhileStmt(ast, args) { 
        let condition = ast.cond.visit(this, args);
        while (condition === true) {
            ast.stmt.visit(this, args);
            condition = ast.cond.visit(this, args);
        }
    }

    /**
     * 
     * @param {AST.ReturnStmt} ast 
     * @param {*} args 
     */
    visitReturnStmt(ast, args) { 
        if (ast.retexpr) {
            return ast.retexpr.visit(this, args);
        } else {
            return undefined;
        }
    }
    
    // ------------------------
    // 
    // Expressions
    // 
    // ------------------------

    /**
     * 
     * @param {AST.RefExpr} ast 
     * @param {*} args 
     */
    visitRefExpr(ast, args) { 
        if (ast.ref.qualref) {
            let target = ast.ref.visit(this, args);
            return target.object[target.identifier.id.content];
        } else {
            try {
                return this.environment.lookupBinding(ast.ref.id.content);
            } catch (e) {
                this.report(e.toString(), args);
            }
        }
    }

    /**
     * 
     * @param {AST.CallExpr} ast 
     * @param {*} args 
     */
    visitCallExpr(ast, args) { 
        // throw error if call on "this" object
        if (ast.ref.type == AST.ASTType.ThisRef) this.report(`Cannot call on "this" object`, args);

        let fndef;
        // if ref.ref.ref....(), we find the fndef by visiting the reference
        if (ast.ref.qualref) {
            let target = ast.ref.visit(this, args);
            fndef = target.object[target.identifier.id.content];
        } else {
            // else, we find it in current environment
            fndef = this.environment.lookupBinding(ast.ref.id.content);
        }

        let p = 0;
        let parameter, argument;
        // new scope for parameters
        this.environment.pushScope();
        while (p < fndef.paramlist.length && p < ast.arglist.length) {
            parameter = fndef.paramlist.children[p];
            argument = ast.arglist.children[p];
            this.environment.addBinding(parameter.identifier.content, argument.visit(this, args));
            p += 1;
        }

        while (p < fndef.paramlist.length) {
            parameter = fndef.paramlist.children[p];
            if (parameter.defaultval) {
                this.environment.addBinding(parameter.identifier.content, parameter.defaultval.visit(this, args));
            } else {
                this.report("Missing required argument: " + parameter.identifier.content, args);
            }
            p += 1;
        }

        // Any additional arguments are discarded;
        // after binding all arguments, we evaluate the function body
        // new scope for evaluating function body
        this.environment.pushScope();
        let returnvalue = fndef.stmt.visit(this, args);
        // delete environment for evaluating function body
        this.environment.popScope();
        // delete environment for parameter arguments
        this.environment.popScope();

        return returnvalue;
    }

    /**
     * 
     * @param {AST.IdxExpr} ast 
     * @param {*} args 
     */
    visitIdxExpr(ast, args) { 
        let target;
        if (ast.ref.qualref) {
            let refed = ast.ref.visit(this, args);
            target = refed.object[refed.identifier.id.content];
        } else {
            target = this.environment.lookupBinding(ast.ref.id.content);
        }

        let index = ast.idx.visit(this, args);
        return target[index];
    }

    /**
     * 
     * @param {AST.BinaryExpr} ast 
     * @param {*} args 
     */
    visitBinaryExpr(ast, args) { 
        let lhs = ast.lhs.visit(this, args);
        let rhs = ast.rhs.visit(this, args);
        switch(ast.op.tokentype) {
            // TODO: Finish this
        }
    }

    /**
     * 
     * @param {AST.UnaryExpr} ast 
     * @param {*} args 
     */
    visitUnaryExpr(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.DefinitionExpr} ast 
     * @param {*} args 
     */
    visitDefinitionExpr(ast, args) {
        // TODO: Unimplemented Method
        report();
    }
    
    // ------------------------
    // 
    // Definition
    // 
    // ------------------------

    /**
     * 
     * @param {AST.ObjectDef} ast 
     * @param {*} args 
     */
    visitObjectDef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.ArrayDef} ast 
     * @param {*} args 
     */
    visitArrayDef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.FunctionDef} ast 
     * @param {*} args 
     */
    visitFunctionDef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.LiteralDef} ast 
     * @param {*} args 
     */
    visitLiteralDef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.ParameterDef} ast 
     * @param {*} args 
     */
    visitParameterDef(ast, args) {
        // TODO: Unimplemented Method
        report();
    }

    /**
     * 
     * @param {AST.ObjectPropertyDef} ast 
     * @param {*} args 
     */
    visitObjectPropertyDef(ast, args) {
        // TODO: Unimplemented Method
        report();
    }

    // ------------------------
    // 
    // Reference
    // 
    // ------------------------

    /**
     * 
     * @param {AST.BaseRef} ast 
     * @param {*} args 
     */
    visitBaseRef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.QualRef} ast 
     * @param {*} args 
     */
    visitQualRef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.ThisRef} ast 
     * @param {*} args 
     */
    visitThisRef(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    // ------------------------
    // 
    // Leaf
    // 
    // ------------------------

    /**
     * 
     * @param {AST.Operator} ast 
     * @param {*} args 
     */
    visitOperator(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.CalcString} ast 
     * @param {*} args 
     */
    visitString(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.CalcInt} ast 
     * @param {*} args 
     */
    visitInt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.CalcFloat} ast 
     * @param {*} args 
     */
    visitFloat(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.CalcBool} ast 
     * @param {*} args 
     */
    visitBoolean(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.CalcNull} ast 
     * @param {*} args 
     */
    visitNull(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.Identifier} ast 
     * @param {*} args 
     */
    visitIdentifier(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }
}
exports.Visitor = Visitor;