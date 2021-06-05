# A Simple Markdown Parser in JavaScript

## Support for h1~h6

###### Example: h6

- - - 

## Support for inline styles

We can enter **BOLD texts, *BOLD AND ITALIC texts***, *Italic texts*, ~underlined **BOLD**, *Italic*, **BOLD AND ITALIC**~ texts.

We can also write ~~Strikethrough~~, but it does not support combination with the above three formats.

`Inline Code Snippets` are supported as well. 

Additional tutorials for Markdown could be found at their [wiki page](https://zh.wikipedia.org/wiki/Markdown).

If these styles do not fit your requirements, you could <span style="color:red">insert inline html</span>, but you should be aware of this AUTOMATIC RETURN

- - -

## Support for unordered & ordered lists

1. we can start an ordered list through numbers
1. this do not need to be kept sequential
1. and we could also insert some ~***italic bold underline***~ here. 
13. `codes work fine here too`.
50. Nest a list within this list: 
    - unordered list start
    - [link?](google.com)
    - ~~Strikethrough~~?
10. And we finish a nested list here.

## TODOs: 

- [ ] this is a **todo item**
- [ ] this is another **todo item with ~underline ~~strikethrough *italic~~ end strikethrough~ end underline* end italic** end bold

- - -

## Support for images

![demo](./notes/demo.jpeg)

*Just for testing this function*

- - -


## Code blocks

**NOT YET COMPLETELY FINISHED!** I plan to finish the rest of the functions soon. 


#### LaTeX

LaTeX formulae start with `latex` after a code block, inline latex test $\frac{1}{2}=0.5$

$$
\frac{1}{2} = 0.5
$$

$$
\begin{aligned}
x&=1\\
y&=2
\end{aligned}
$$

#### Graph

```graph
a->b
b->c
a->c:blue
```

#### Other functions still developing

- - -

## Reference blocks

> Within reference blocks, no format will be applied
> If you wish to apply additional format, then you should <span style="color:red">insert html blocks</span>

<script>console.log("END")</script>