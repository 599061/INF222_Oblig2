# INF222 V26 - Obligatory Assignment 2 - Part 3

Summary of Oblig2:
- In Part 1, you defined the grammar for the *Zerow* programming language.
- In Part 2, you implemented validations to ensure that programs written in *Zerow* are meaningful.
- In Part 3, you will implement **code generation** from Zerow code to WebAssembly bytecode.

Your task is to translate a validated *Zerow* program into **WebAssembly (Wasm) bytecode**.
This means that you will traverse the AST and generate the corresponding WebAssembly instructions.
All code generation logic will operate on the AST produced by Langium (i.e., the JSON representation of the AST), starting at the root node.

# Prework before code generation

Before you start traversing the AST and generating WebAssembly bytecode, you must first update two of the helper files provided in the project.

Replace the files
```
packages/cli/src/generator.ts
packages/cli/src/util.ts
```
with the new version of [`generator.ts`](part-3_files/generator.ts) and [`util.ts`](part-3_files/util.ts) that are available in this repository.

The `generator.ts` file contains a starting point for generating the Wasm bytecode.

The `util.ts` file contains a collection of **utility functions for constructing WebAssembly bytecode**. These functions implement many of the low-level encoding details of the WebAssembly binary format, such as:

* encoding integers using [LEB128](https://en.wikipedia.org/wiki/Endianness)
* constructing WebAssembly sections
* defining types of functions
* generating instructions in bodies of functions

Your compiler will use these helper functions when generating the WebAssembly module.

## Completing the missing functions

Some functions in `util.ts` are intentionally left **without an implementation**.  
These functions are marked with a `TODO` comment.  
Your task is to implement all of these functions before continuing with the rest of the assignment.

For each missing function:
* A detailed description of the expected behavior is provided in the **comment above the function**.
* The comment explains how the function should construct the appropriate WebAssembly byte sequence.
* The function implementation should follow these instructions.

It is recommended that you **carefully read through the entire file first**, in order to understand how the different helper functions relate to each other. Many of the functions build upon each other to construct complete WebAssembly sections.

Once these functions have been implemented, you can begin implementing the **actual code generation phase** of the compiler.

# Defining the WASM module

Before generating instructions for expressions and statements, you must first define the **structure of the WebAssembly module**.

A minimal WebAssembly module consists of a sequence of sections.
For this assignment, you only need to generate the following four sections:

```
type section (0x01)
function section (0x03)
export section (0x07)
code section (0x0A)
```

Each section has a specific role, as summarized below.

### Type section (0x01)

The **type section** defines the function signatures used in the module.

### Function section (0x03)

The **function section** declares the functions that exist in the module and associates them with their types.  

### Export section (0x07)

The **export section** determines which functions are accessible from outside of the WebAssembly module.  
For this assignment, you only need to export a single function, and that function should be called `main`.
This function will contain the code of a program written in _Zerow_.

### Code section (0x0A)

The **code section** contains the actual instructions executed when the function is run.
This is where the compiled instructions corresponding to *Zerow* statements and expressions will be placed.


# Walking the tree

Once the module structure is defined, the next step is to **traverse the AST** of a *Zerow* program.

The traversal should start at the root node:

```
Program
```

This is the same starting point you used in **Part 2** when implementing the validators.

However, instead of just performing validations, you will now **generate WebAssembly instructions** while visiting the nodes.

During the traversal you should:

* visit declarations
* visit assignments
* visit expressions
* visit return statements

Each node type should emit the corresponding **WebAssembly instructions** that implement its behavior.

For example,
a variable reference should produce a `local.get` instruction.

Expressions should follow the stack-machine semantics of WebAssembly.
This means that operands must first be pushed onto the stack before applying an operation.

For example, the expression:

```
a add b
```

should roughly translate to:

```
local.get a
local.get b
i32.add
```


# Implementation notes

The following notes clarify several aspects of the implementation.

## Type compatibility

In Part 2, you already implemented validation that ensures type correctness of binary expressions.
Because of this, the code generator does not need to re-check types.

You may therefore safely assume that:

* All binary expressions contain operands with compatible units.
* No invalid expressions will reach the code generation phase.

Your task is only to **generate the correct WebAssembly instructions**, not to perform any additional validations.

## Negation of literals

In Part 1, we introduced the keyword:

```
neg
```

which allows integer literals to be negated.

Example:

```
neg 8[m]
```

For this assignment, **negation only applies to integer literals**, not to arbitrary expressions.

In other words, the following is valid:

```
neg 5[kg]
```

but the following is **NOT REQUIRED** to be supported:

```
neg (a add b)
```

When generating WebAssembly instructions, a negated literal should simply produce a negative integer constant.

## Local variables

Please note that WebAssembly does _not_ refer to variables using their names.
Instead, variables are represented using _numeric indices_.
Each variable declared in a program must therefore be assigned a _local variable index_.
These indices are then used in WebAssembly instructions such as `local.get` and `local.set`.

### Example

Consider the following program:

```
unit kg
unit m

declare a equals 2 [kg]
declare b equals 3 [kg] add 5 [kg]
declare c equals 6 [m] sub 2 [m] mul 2 [m]
declare d equals (a add b) mul 10 [kg]

assign 4 [kg] to b
assign b add 4 [kg] to a
assign neg 8[m] to d

returns 1 [kg] add b
returns a add b
returns 3 [m] sub c
returns d add c mul 10 [m]
```

The declared variables should be assigned indices in the _order in which they are declared_:

```
// a = 0
// b = 1
// c = 2
// d = 3
```


## Return values

As mentioned earlier, *Zerow* allows **multiple return statements**.
Each `returns` statement should generate instructions that compute the corresponding value and leave it on the stack.
WebAssembly supports functions that return multiple values, which matches the design of *Zerow*.
Therefore, when compiling return statements, the generated instructions should evaluate each expression and leave the result on the stack in the correct order.

# Summary

Your implementation should:

* Traverse the AST starting at the `Program` node.
* Generate WebAssembly instructions for expressions and statements.
* Map variables to local variable indices.
* Construct a WebAssembly module containing:

  * a type section
  * a function section
  * an export section
  * a code section
* Export a single function which will be named `main`.

Once implemented, your compiler will be able to translate *Zerow* programs into valid WebAssembly modules that can be executed in any WebAssembly runtime.


# Running the program

At this point, your compiler is capable of translating a *Zerow* program into WebAssembly bytecode.
The final step is to make it possible to execute the generated WebAssembly module from the command line.

As mentioned in the README of the skeleton code, the CLI tool should support the following command:

**Mac / Linux**
```
./packages/cli/bin/cli.js run <input file>
```
**Windows**
```
.\packages\cli\bin\cli.js run <input file>
```

Before this command can work, you must implement some functionality in the file:
```
packages/cli/src/main.ts
```

In this section, you will implement the code necessary to:
* Load a compiled WebAssembly module
* Compile a *Zerow* program from a source file
* Execute the exported `main` function
* Print the result to the console

## Loading a WebAssembly module

The first step is to define a helper function that loads a WebAssembly module from the bytecode produced by your compiler.

Copy-paste the following function:

```typescript
function loadMod(bytes: BufferSource) {
  const mod = new WebAssembly.Module(bytes);
  return new WebAssembly.Instance(mod).exports;
}
```

### Explanation

The parameter `bytes` contains the **WebAssembly bytecode** generated by your compiler.

This function performs two steps:
1. Create a WebAssembly module from the raw bytecode.
2. Instantiate the module and return its exported functions.

The returned value contains the exported members of the module, including the `main` function that your compiler generates.

## Compiling and running a program

Next, define an asynchronous function that:
1. Reads the input program
2. Parses it into an AST
3. Compiles it to WebAssembly
4. Executes the exported `main` function

Copy-paste the following function:

```typescript
const compileAndRun = async (source: string): Promise<void> => {
  const services = createZerowServices(NodeFileSystem).Zerow;
  const model = await extractAstNode<Program>(source, services);
  const wasmByteCode = compile(model);
  let wasmMain = loadMod(wasmByteCode).main as CallableFunction;
  console.log(chalk.green(`Wasm output: ${wasmMain()}`));
}
```

### Explanation

This function performs the following steps:

1. **Create the language services**  
   The Langium services are initialized so that the program can be parsed.
2. **Parse the source file**  
   The source code is parsed into an AST whose root node is `Program`.
3. **Compile the AST**  
   Your `compile` function (implemented earlier in this part) converts the AST into WebAssembly bytecode.
4. **Load the WebAssembly module**  
   The bytecode is passed to the `loadMod` function, which returns the exported members of the module.
5. **Execute the `main` function**  
   The exported `main` function is executed, and its result is printed to the console.

# Defining the `run` command
Finally, you must add a new command to the CLI that invokes the `compileAndRun` function.  
This command should be defined inside the `default` function in `packages/cli/src/main.ts`.

Copy-paste the following code:
```typescript
program
    .command('run')
    .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
    .description('Attempt to compile and run the given program')
    .action(compileAndRun);
```

before the `program.parse(process.argv)` in this code:
```typescript
export default function (): void {
  const program = new Command();

  program.version(JSON.parse(packageContent).version);
  // Other commands defined here
  // ...


  // Paste here

  program.parse(process.argv);
}
```

### Explanation
This code registers a new CLI command:

```
run <file>
```

When the user executes this command, the CLI will:

1. Read the specified input file
2. Compile the program
3. Execute the resulting WebAssembly module
4. Print the output to the terminal


# Summary
At this point, you have completed a **fully working compiler pipeline**:

```
Zerow source code
        ↓
Langium parser
        ↓
AST
        ↓
Validation
        ↓
Code generation
        ↓
WebAssembly module
        ↓
Execution via CLI
```

# Running the tests

To help you verify your implementation, we have provided a set of **automated tests** for this obligatory assignment. 

If you are unsure about any of the setup steps described below, you can also consult the **skeleton code** repository, which will be updated with the same configuration.

Before you can run the tests, a few small setup steps are required.

### Adding a test command to the main package
First, you need to define a test command in the root package.json file of the repository.

Inside the `scripts` field, add the following entry:
```JSON
"test": "npm run --workspace packages/cli test"
```
This command tells npm to run the test script defined inside the packages/cli workspace.

### Configuring the CLI package

Next, open the file:
```
packages/cli/package.json
```
Inside the `scripts` section of this file, add the following command:
```JSON
"test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --detectOpenHandles"
```
You must also add the following development dependency:
```JSON
"devDependencies": {
  "jest": "^30.3.0"
}
```
The testing framework used for this assignment is Jest.

### Adding the test files
#### Step 1
Inside the directory
```
packages/cli/
```
create a new folder named:
```
tests
```

Inside this folder, add the file:
```
studentTests.test.js
```

This file is provided in this repository.

#### Step 2

Next, create another folder inside `packages/cli/` called:
```
test_programs
```

Then copy all files from the [`test_programs`](part-3_files/test_programs) folder in this repository into this directory.

These files contain example *Zerow* programs that will be compiled and executed by the tests.

### Installing the new dependency

After updating the configuration files, install the new dependencies by running:
```
npm install
```

## Running the tests

After completing the steps above, you can run all tests by navigating to the **root directory of the repository** and executing the following command:
```
npm test
```
