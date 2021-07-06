const AST = require("./AST");

let report = () => { throw "Unimplemented method"; };

class Visitor {

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
        // TODO: Unimplemented Method
        report(); 
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
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.AssignStmt} ast 
     * @param {*} args 
     */
    visitAssignStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.IdxAssignStmt} ast 
     * @param {*} args 
     */
    visitIdxAssignStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.BlockStmt} ast 
     * @param {*} args 
     */
    visitBlockStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.IfElseStmt} ast 
     * @param {*} args 
     */
    visitIfElseStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.ForStmt} ast 
     * @param {*} args 
     */
    visitForStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.WhileStmt} ast 
     * @param {*} args 
     */
    visitWhileStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.ReturnStmt} ast 
     * @param {*} args 
     */
    visitReturnStmt(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
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
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.CallExpr} ast 
     * @param {*} args 
     */
    visitCallExpr(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.IdxExpr} ast 
     * @param {*} args 
     */
    visitIdxExpr(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
    }

    /**
     * 
     * @param {AST.BinaryExpr} ast 
     * @param {*} args 
     */
    visitBinaryExpr(ast, args) { 
        // TODO: Unimplemented Method
        report(); 
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