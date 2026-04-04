# INF222 V26 - Obligatory Assignment 2 - Part 1

![zerow inf222 logo](zerow-logo.png)

# Task

The first part of this obligatory is to implement a grammar for a programming language.
This language is called _Zerow_, reflecting the fact that its expressive power is very close to nothing, and that it's compiled to WebAssembly. 
You are supposed to use the [language workbench Langium](https://langium.org/) to implement the tasks in this obligatory assignment.

Instead of giving you a precise description of the _Zerow_ language -- which would mean revealing the grammar that _you_ are supposed to come up with -- we give you a high-level description of the language with some code examples written in it.
Based on this informal description and the examples, you are supposed to come up with the grammar.

The _Zerow_ programming language has the following four constructs:
* declarations of [measurement units](https://en.wikipedia.org/wiki/Unit_of_measurement)
* declarations of variables
* assignments to variables
* return statements

We can showcase this language by the following code example:

```
// declare measurement units

unit kg
unit m

// declare variables

declare a equals 2 [kg]
declare b equals 3 [kg] add 5 [kg]
declare c equals 6 [m] sub 2 [m] mul 2 [m]
declare d equals (a add b) mul 10 [kg]

// assignments to variables

assign 4 [kg] to b
assign b add 4 [kg] to a
assign neg 8[m] to d

// return statements

returns 1 [kg] add b
returns a add b
returns 3 [m] sub c
returns d add c mul 10 [m]
```

We will now explain each of the language constructs in a bit more detail, and bring your attention to important nuances around them.


# Declaration of a measurement unit

#### Example

An example of this construct:
```
unit kg
```

In this example, we introduce a measurement unit `kg`.

Obviously, the name of the unit (`kg`) is user-defined, so we could have declared something like this:
```
unit blabla
```

#### Semi-formal definition

A declaration of unit starts with the keyword `unit`, which is followed by the name of the unit.

#### Nuances

- We do not give any physical meaning to the names of the units. For example, `kg` doesn't _really_ represent kilograms.
- In our language, each value can be equipped with a measurement unit. We will treat the measurement unit of a variable as the "type" of this variable. This will be relevant in Part 2 of this obligatory.


# Variable declaration

#### Example
An example of this construct:
```
declare a equals 1 [kg]
```

Here we declare variable `a`, and give it an initial value `1 [kg]`.
Note that the integer literal `1` is equipped with a measurement unit, which in this case is `kg`.

Again, we could have declared a variable like this:
```
declare helloWorld equals 5 [blabla]
```
This is a declaration of variable `helloWorld`, which has an initial value `5` equipped with measurement unit `blabla`.

#### Semi-formal definition

A variable declaration starts with the keyword `declare`, which is followed by the name of the variable, followed by the keyword `equals`, followed by the initial value that will be assigned to this variable.

#### Nuances
We only allow a variable to be declared once.


# Variable assignment

#### Example
```
assign 4[kg] to b
```
Here we assign the value `4` (equipped with the measurement unit `kg`) to the variable `b`.
Please note that the concrete syntax of assignments in the _Zerow_ language differs from the "classical" syntaxes in other programming language, which usually first specify the name of the assignee, and then the value (e.g., in Java: `b = 4;`).

#### Semi-formal definition

An assignment statement starts with the keyword `assign`, followed by the value, followed by the keyword `to`, followed by the name of the variable we are assigning to.

#### Nuances

##### Nuance 1

When we assign a válue to a variable, it may happen that thát válue will be "re-equipped" with a different measurement unit. This essentially will mean that the "type" of the variable can change at each assignment statement. 
Example:
```
unit USD
unit EUR
declare a equals 1 [USD] // variable `a` has "type" `USD`
assign 2 [EUR] to a // now the "type" of the variable `a` has been changed-on-the-fly to be `EUR`
```
Please note that _Zerow_ doesn't do any conversions, neither does it actually care about a change of type of a variable mid-program. We will study type systems later in INF222, and it will become clearer why such a feature is sometimes useful in programming languages. From the perspective of this Obligatory Assignment, we have designed _Zerow_ this way so that it would be easier for you to implement it.

###### Nuance 2
We should only be allowed to assign to variables that have been declared before.

- _Hint:_ Using cross references in Langium, you can check that a variable has been declared _somewhere_ in the program.
- In Part 2, you will implement the requirement that the variable has to be declared _before_ it's used.


# Return statements
An example of a `returns` statement:
```
returns 1 [kg]
```

Somewhat surprisingly, we allow multiple `returns` statements in a program:
```
unit kg
unit m
unit USD
unit year

returns 1 [kg]
returns 2 [m]
returns 3 [USD]
returns 100 [year]
```
This program will return four WebAssembly i32 values (`1`, `2`, `3`, and `100`), in other words, it will return a _tuple_ with four values.
We have chosen this design for _Zerow_ because it maps nicely to WebAssembly, which also supports functions with multiple returned values.

#### Nuances

Of course, a program can have just one (or even none) return statement.


# Program

As can be seen from the very first example on top of this page, a program written in _Zerow_ starts with declarations of measurement units, which are followed by variable declarations and assignments to them, and ends with a sequence of return statements.

```
unit kg
declare x equals 1 [kg]
assign 2 [kg] to x
returns x
```

#### Nuances

##### Nuance 1
Declarations of measurement units should be at the very beginning of the program in _Zerow_. This means that neither variable declarations, nor variable assignments, nor return statement are allowed to appear before declarations of measurement units.

##### Nuance 2
Variable declarations and variable assignments can be interleaved in any order. This means that the following two _Zerow_ programs are equivalent:
```
unit kg
declare x equals 1 [kg]
declare y equals 1 [kg]
assign 2 [kg] to x
returns x
```

and

```
unit kg
declare x equals 1 [kg]
assign 2 [kg] to x
declare y equals 1 [kg]
returns x
```

##### Nuance 3
Return statements should appear at the very end of the program. This means that neither variable declarations, nor variable assignments, nor unit declarations are allowed to appear after the "section" with `returns` statements has started.


# Expressions
As can be seen in the very first code example at the top of the page, variable declarations, variable assignments and return statements all make use of **expressions**.

An example:
```
unit kg
declare a equals 1 [kg] add 2 [kg]
```
The initial value of this variable is essentially `1 + 2`, equipped with the measurement unit `kg`.

#### Nuances

Please note that we use a non-conventional verbose syntax on purpose. Thus, instead of `+`, _Zerow_ uses `add`, instead of `-` it uses `sub`, instead of `*` it uses `mul`, and instead of `/` it uses `div`.

As an example, the Java expression `(1 + 2) * 3 / (4 + 5) + 6` would be written as `(1[kg] add 2[kg]) mul 3[kg] div (4[kg] add 5[kg]) add 6[kg]` in _Zerow_. Please note that we always have to equip literal values with measurement units.

As another example, the Java expression `a + b` would be written as `a add b` in _Zerow_. Please note that in this case, we don't have to equip variable names with their measurement units, since those can be automatically inferred. This will be done in Part 2 of this obligatory assignment.

#### Semi-formal definition

Expressions can be:
* Binary expressions
    * Additive expressions (`1[kg] add 2[kg]`, `1[NOK] sub 2[NOK]`)
    * Multiplicative expressions (`1[m] mul 2[m]`, `1[g] div 2[g]`)
* Primary expressions
    * Integer literal (`1[kg]`)
    * Variable name
    * Group expressions

#### More nuances

##### Nuance 1
Expressions in _Zerow_ should follow the standard mathematical priority of operations and associativity. This means that multiplication and divition come before addition and subtraction. When the order of operations is equal (e.g., `1[USD] add 2[USD] add 3[USD] add 4[USD] add 5[USD]`), the binary expression should be left-assiociative.

##### Nuance 2
An integer literal has a value and is equipped with a measurement unit, which is enclosed in square brackets.
```
42[kg]
```

##### Nuance 3
It should also be possible to declare negative values by using the keyword `neg`.
```
neg 26[m]
```

##### Nuance 4
Only previously declarared variables can be used in expressions.
```
unit kg
unit kg
declare a equals 1 [kg]
declare b equals 2 [kg]
returns a add b // this is OK
returns a add c // this is not allowed because variable `c` has not been declared
```