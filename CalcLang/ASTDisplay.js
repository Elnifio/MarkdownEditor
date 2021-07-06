let AST = require("./AST");

let show = (prefix, msg) => console.log(prefix + msg);

class Visitor {

    display(ast) {
        ast.visit(this, "");
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
        show(args, ast.stringify);
        ast.children.forEach(x => x.visit(this, args+" | "));
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
        show(args, ast.stringify);
        ast.expr.visit(this, args + " | ");
    }

    /**
     * 
     * @param {AST.AssignStmt} ast 
     * @param {*} args 
     */
    visitAssignStmt(ast, args) { 
        show(args, ast.stringify);
        let prefix = args+" | ";
        ast.ref.visit(this, prefix);
        ast.expr.visit(this, prefix);
    }

    /**
     * 
     * @param {AST.IdxAssignStmt} ast 
     * @param {*} args 
     */
    visitIdxAssignStmt(ast, args) { 
        show(args, ast.stringify);
        let prefix = args + " | ";
        ast.ref.visit(this, prefix);
        ast.idx.visit(this, prefix);
        ast.expr.visit(this, prefix);
    }

    /**
     * 
     * @param {AST.BlockStmt} ast 
     * @param {*} args 
     */
    visitBlockStmt(ast, args) { 
        show(args, ast.stringify);
        ast.children.forEach(x => x.visit(this, args+" | "));
    }

    /**
     * 
     * @param {AST.IfElseStmt} ast 
     * @param {*} args 
     */
    visitIfElseStmt(ast, args) { 
        show(args, ast.stringify);
        let prefix = args + " | ";
        ast.cond.visit(this, prefix);
        ast.ifblock.visit(this, prefix);
        if (ast.elseblock) ast.elseblock.visit(this, prefix);
    }

    /**
     * 
     * @param {AST.ForStmt} ast 
     * @param {*} args 
     */
    visitForStmt(ast, args) { 
        show(args, ast.stringify);
        let prefix = args + " | ";
        ast.varname.visit(this, prefix);
        ast.iterexpr.visit(this, prefix);
        ast.stmt.visit(this, prefix);
    }

    /**
     * 
     * @param {AST.WhileStmt} ast 
     * @param {*} args 
     */
    visitWhileStmt(ast, args) { 
        show(args, ast.stringify);
        let prefix = args + " | ";
        ast.cond.visit(this, prefix);
        ast.stmt.visit(this, prefix);
    }

    /**
     * 
     * @param {AST.ReturnStmt} ast 
     * @param {*} args 
     */
    visitReturnStmt(ast, args) { 
        show(args, ast.stringify);
        if (this.retexpr) {
            this.retexpr.visit(this, args+" | ");
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
        show(args, ast.stringify);
        ast.ref.visit(this, args + " | ");
    }

    /**
     * 
     * @param {AST.CallExpr} ast 
     * @param {*} args 
     */
    visitCallExpr(ast, args) { 
        show(args, ast.stringify);
        let prefix = args+" | ";
        show(prefix, "Function Reference");
        ast.ref.visit(this, prefix+" | ");
        if (ast.arglist) {
            show(prefix, "Function Arguments");
            ast.arglist.forEach(x => x.visit(this, prefix+" | "));
        }
    }

    /**
     * 
     * @param {AST.IdxExpr} ast 
     * @param {*} args 
     */
    visitIdxExpr(ast, args) { 
        show(args, ast.stringify);
        ast.ref.visit(this, args+" | ");
        ast.idx.visit(this, args+" | ");
    }

    /**
     * 
     * @param {AST.BinaryExpr} ast 
     * @param {*} args 
     */
    visitBinaryExpr(ast, args) { 
        show(args, ast.stringify);
        ast.lhs.visit(this, args+" | ");
        ast.op.visit(this, args+" | ");
        ast.rhs.visit(this, args+" | ");
    }

    /**
     * 
     * @param {AST.UnaryExpr} ast 
     * @param {*} args 
     */
    visitUnaryExpr(ast, args) { 
        show(args, ast.stringify);
        ast.op.visit(this, args+" | ");
        ast.target.visit(this, args+" | ");
    }

    /**
     * 
     * @param {AST.DefinitionExpr} ast 
     * @param {*} args 
     */
    visitDefinitionExpr(ast, args) {
        show(args, ast.stringify);
        ast.definition.visit(this, args + " | ");
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
        show(args, ast.stringify);
        ast.proplist.forEach(x => x.visit(this, args+" | "));
    }

    /**
     * 
     * @param {AST.ArrayDef} ast 
     * @param {*} args 
     */
    visitArrayDef(ast, args) { 
        show(args, ast.stringify);
        ast.exprs.forEach(x => x.visit(this, args+" | "));
    }

    /**
     * 
     * @param {AST.FunctionDef} ast 
     * @param {*} args 
     */
    visitFunctionDef(ast, args) { 
        show(args, ast.stringify);
        let prefix = args + " | ";
        if (ast.paramlist) { 
            show(prefix, "Parameter List");
            ast.paramlist.forEach(x => x.visit(this, prefix+" | "));
        }
        show(prefix, "Body");
        ast.stmt.visit(this, prefix+" | ");
    }

    /**
     * 
     * @param {AST.LiteralDef} ast 
     * @param {*} args 
     */
    visitLiteralDef(ast, args) { 
        show(args, ast.stringify);
        ast.literal.visit(this, args+" | ");
    }

    /**
     * 
     * @param {AST.ParameterDef} ast 
     * @param {*} args 
     */
    visitParameterDef(ast, args) {
        show(args, ast.stringify);
        ast.identifier.visit(this, args+" | ");
        if (ast.defaultval) ast.defaultval.visit(this, args+" | ");
    }

    visitObjectPropertyDef(ast, args) {
        show(args, ast.stringify);
        ast.key.visit(this, args+" | ");
        ast.value.visit(this, args+" | ");
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
        show(args, ast.stringify);
        ast.id.visit(this, args+" | ");
        if (ast.qualref) {
            ast.qualref.visit(this, args+" | ");
        }
    }

    /**
     * 
     * @param {AST.QualRef} ast 
     * @param {*} args 
     */
    visitQualRef(ast, args) { 
        show(args, ast.stringify);
        ast.id.visit(this, args+" | ");
        if (ast.qualref) {
            ast.qualref.visit(this, args+" | ");
        }
    }

    /**
     * 
     * @param {AST.ThisRef} ast 
     * @param {*} args 
     */
    visitThisRef(ast, args) { 
        show(args, ast.stringify);
        if (ast.qualref) {
            ast.qualref.visit(this, args+" | ");
        }
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
        show(args, ast.stringify);
    }

    /**
     * 
     * @param {AST.CalcString} ast 
     * @param {*} args 
     */
    visitString(ast, args) { 
        show(args, ast.stringify);
    }

    /**
     * 
     * @param {AST.CalcInt} ast 
     * @param {*} args 
     */
    visitInt(ast, args) { 
        show(args, ast.stringify);
    }

    /**
     * 
     * @param {AST.CalcFloat} ast 
     * @param {*} args 
     */
    visitFloat(ast, args) { 
        show(args, ast.stringify);
    }

    /**
     * 
     * @param {AST.CalcBool} ast 
     * @param {*} args 
     */
    visitBoolean(ast, args) { 
        show(args, ast.stringify);
    }

    /**
     * 
     * @param {AST.CalcNull} ast 
     * @param {*} args 
     */
    visitNull(ast, args) { 
        show(args, ast.stringify);
    }

    /**
     * 
     * @param {AST.Identifier} ast 
     * @param {*} args 
     */
    visitIdentifier(ast, args) { 
        show(args, ast.stringify);
    }
}
exports.Displayer = Visitor;