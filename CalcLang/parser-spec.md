# Parser Grammar Specification

## Program

```
Program := ( Statement )*
```
- - -
## Statement

```
Statement   := EvaluationStatement
            := AssignStatement
            := IfElseStatement
            := ForLoopStatement
            := WhileLoopStatement
            := ReturnStatement
            := BlockStatement
```

### Block Statement

Block statement consists of a list of statements.
On evaluation, it sequentially evaluates the list

```
BlockStatement  := { Statement* } 
```

### Evaluation Statement

Evaluation statements, on evaluation, should evaluate the expression, 
stringify the result, 
and print it onto the result board;

```
EvaluationStatement := Expression ;
```

### Assignment Statement

Assignment statement should, on evaluation,
evaluate the right-hand-side and add the result onto the environment

```
AssignStatement := Reference = Expression ;
                := Reference [ Expression ] = Expression ;
```

### If-Else Statement

Evaluates statement based on the branch result

```
IfElseStatement := if ( Expression ) Statement (else Statement)*
```

### For-loop Statement

It is assumed that the iterated object has methods `hasNext()` and `next()`,

```
ForLoopStatement    := for ( VariableName in Expression ) Statement
```

### While-loop Statement

```
WhileLoopStatement  := while ( Expression ) Statement
```

### Return Statement

When encountered outside a function, the evaluator should throw an error

```
ReturnStatement     := return Expression ;
```
- - -

## Expression

```
Expression  := Reference
            := Reference ( Arg-list? )
            := Reference [ Expression ]
            := ( Expression )
            := Expression BinaryOperator Expression
            := UnaryOperator Expression
            := Definitions
--------
Arg-list    := Argument (, Argument)*
Argument    := Expression
```

### Operators Precedence

**Unary Operators precedes before Binary Operators**.

Binary Operator Precedence: 

```
(^ ~) > (* /) > (+ -) > (> < >= <=) > (== !=) > (&) > (|)
```

- - -

## Definitions

```
Definitions := ObjectDefinition
            := ArrayDefinition
            := FunctionDefinition 
            := LiteralDefinition
--------
ObjectDefinition    := { (e | id : Expression (, id : Expression)*) }
ArrayDefinition     := [ (e | Expression (, Expression)*) ]
FunctionDefinition  := fn ( Param-list? ) Statement
LiteralDefinition   := string | int | float | true | false | null
--------
Param-list      := RequiredList (, Optional)?
RequiredList    := e | id (, id)*
Optional        := id = Expression (, id = Expression)*
```

- - -

## Reference

```
Reference   := Reference . id
            := id | this
```
- - -


