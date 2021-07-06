# Components of Calc Language

The Calc language should have the following components:

# Separator between expressions: Semicolon `;`

# Comments

All comments start with `#` and end with a `\n`

# Operations

## arithmetic operations: 
Plus: `+` 

Minus: `-` 

Times: `*`

Divide: `/`

Power: `^`

Root: `~`

## boolean operations:

And: `&`

Or: `|`

Not: `!`

Xor: `+` - when evaluating Operator `+`, we need to check the type of LHS & RHS: `boolean` -> Xor, `int` | `Float` -> Plus, `string` -> String Concatenation

## comparisons: 

Greater than: `>`

Smaller than: `<`

Greater or Equal than: `>=`

Smaller or Equal than: `<=`

Equal: `==`

Not Equal: `!=`

# Types

## Basic Types

### int, float

grammar: `[0-9]+(\.[0-9]*)?`

### string

grammar: `" .* " | ' .* '`

### boolean

grammar: `true | false`

## Complex Types

### Objects

Definition grammar: `{ (<prop-name> : <expression>)* }`;

Reference grammar: `<variable-name> . <prop-name>`;

### Lists

Definition grammar: `[ (<expression> ,)* ]`;

Reference grammar: `<variable-name> [ <expression> ]`;

### Functions

Definition grammar: `fn ( <param-list> ) { <statement>* }`;

Call grammar: `<variable-name> ( <arg-list> )`

# flow control

## if-else

grammar: `if ( <expression> ) { <statement> } (else { <statement> })?`

## while loop:

grammar: `while ( <expression> ) { <statement> }`
## for loop: 

grammar: `for ( <variable-name> in <expression> ) { <statement> }`

# variables

variable declaration: `<variable-name> = <expression>`

Valid variable name grammar: `[a-zA-Z][a-zA-Z0-9]*`

# Raw Expressions

Raw codes are given with the following grammar: `raw ( <expression> )`, a raw expression object contains methods:
     - `toLatex()` which when called will provide the latex-ed string of the expression
     - `eval()` which when called will provide the evaluation result under current environment

- - -
# Evaluation

## Normal Code Block

Codes wrapped inside the following code block should be treated as normal Calc Language pieces
and the code block be evaluated when: the cursor is inside the code block, and `shift+enter` is pressed.

Normal Calc code block style: 

> \```Calc
> 
> `<code contents>`
> 
> \```

## Expression Display Block

Codes wrapped inside the following contents should be treated as Expression Display Block where the expressions will be de-referenced and formatted as latex contents on `shift+enter`.

Expression Display Block style: 

> \$\$Calc
> 
> `<code contents>`
> 
> \$\$

- - - 


