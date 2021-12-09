Expected: 

```CalcLang
a = 1;  # Output: none
b = 2;  # Output: none
c = 3;  # Output: none
d = 4;  # Output: none
show(a * b / c * d^(1/2) = eval(lhs)); 
        # Output: {a \cdot b \over c} \cdot d ^ {1 \over 2} = 2.3333333
show([a, b, c, d] = [eval(a), eval(b), eval(c), eval(d)]); 
        # Output: \begin{aligned}\begin{bmatrix}a & b & c & d\end{bmatrix}\end{aligned} = \begin{aligned}\begin{bmatrix}1 & 2 & 3 & 4\end{bmatrix}\end{aligned}
show([[a,b,c],[a,b,c]]); 
        # Output: \begin{aligned}\begin{bmatrix}
```

```CalcLang

```