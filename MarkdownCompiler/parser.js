let Lexer = require("./lexer");
/**
 *  ------------------------------------------------
 *  Markdown Grammar: 
 *  ----------------
 *  # Entire Markdown file is constituted with collection of blocks
 *  # Each block ends with one or more \n
 *  MD              :=  (Block ENTER+)*
 *  
 *  # All possible Block-level elements
 *  Block           :=  Paragraph       # A single paragraph
 *                      Separator       # Separator, <hr />
 *                      CodeBlock       # Code Block, ```...```
 *                      LaTeX           # LaTeX, $$...$$
 *                      Image           # Image block - cannot create inline image
 *                      UnorderedList   # Unordered lists as block elements
 *                      OrderedList     # Ordered lists as block elements
 *                      TODOList        # Todo lists as block elements
 *                      Reference       # Reference block
 *                      Header          # Header block
 *  
 *  # A paragraph is a collection of Sentence, separated with \n
 *  Paragraph       :=  (Sentence ENTER)+
 *  
 *  # All collections of possible inline elements
 *  Sentence        :=  BasicSentence   # Basic Sentence - if any element parsing raise an error, we fall into this case
 *                      Bolds           # Bold Sentence - **...**
 *                      Italics         # Italic Sentence - *...*
 *                      StrikeThroughs  # StrikeThrough Sentence - ~~...~~
 *                      Underlines      # Underline Sentence - ~...~
 *                      InlineCodes     # Inline code blocks - `...`
 *                      InlineLaTeXs    # Inline LaTeX - $...$
 *                      Links           # Inline links - [...](...)
 * 
 *  # Basic sentences
 *  BasicSentence   :=  (not (ENTER, Identifiers)) *   # A sentence can contain anything except a ENTER, or inline-element identifiers, 
 *                                                       and should not start with SPACE
 *  
 *  # Styles
 *  Bolds           :=  BIdentifier Sentence? BIdentifier?
 *  Italics         :=  IIdentifier Sentence? IIdentifier?
 *  StrikeThroughs  :=  STIdentifier Sentence STIdentifier?
 *  Underlines      :=  ULIdentifier Sentence? ULIdentifier? 
 *  InlineCodes     :=  CIdentifier Sentence? CIdentifier?
 *  inlineLaTeXs    :=  LIdentifier Sentence? LIdentifier?
 *  Links           :=  LSQUARE Sentence? RSQUARE LPAREN Sentence? RPAREN
 * 
 *  # Styles Identifier
 *  BIdentifier     := (ASTERISK | UNDERLINE) length 2  # lookahead: if next is space, then collapse to Italics
 *  IIdentifier     := (ASTERISK | UNDERLINE) length 1  
 *  STIdentifier    := TILDA length 2                   # lookahead: if next is space, collapse to Underlines
 *  ULIdentifier    := TILDA length 1
 *  CIdentifier     := BACKTICK length 1
 *  LIdentifier     := DOLLAR length 1
 * 
 *  # Separators
 *  Separator       := ((ASTERISK | MINUS) SPACE?)+
 *  
 */

let Parser = function(giventext="") {
    this.accumulator = [];
    this.specialsCollector = [];
    this.parse = function(text=giventext) {
        
    }
}
