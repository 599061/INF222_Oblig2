import type { Expression, Program } from 'zerow-language';
import { isBinaryExpression, isGroupExpression, isLiteral, isNegation, isVariableReference } from 'zerow-language';
import * as fs from 'node:fs';
import {
    extractDestinationAndName, Info, module,
    typesec, funcsec, exportsec, codesec,
    functype, typeidx, export_, exportdesc,
    code, func, locals, localidx,
    instr, valtype, i32
} from './util.js';

export function generateOutput(model: Program, source: string, destination: string): string {
    const data = extractDestinationAndName(destination);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(destination, compile(model));
    return destination;
}

export function compile(model: Program) {
    const { instructions, numLocals, numReturns } = generateProgram(model);

    const returnTypes = Array(numReturns).fill(valtype.i32);

    const mod = module([
        typesec([functype([], returnTypes)]),
        funcsec([typeidx(0)]),
        exportsec([export_('main', exportdesc.func(0))]),
        codesec([code(func(
            numLocals > 0 ? [locals(numLocals, valtype.i32)] : [],
            [...instructions, instr.end]
        ))]),
    ]);

    return Uint8Array.from(mod.flat(Infinity));
}

function generateProgram(model: Program): { instructions: any[], numLocals: number, numReturns: number } {
    const symbols: Map<string, Info> = new Map();
    const instructions: any[] = [];

    // Assign a numeric index to each declared variable in order
    for (const stmt of model.stmt) {
        if (stmt.$type === 'VariableDeclaration') {
            symbols.set(stmt.name, { name: stmt.name, idx: symbols.size });
        }
    }

    // Generate instructions for declarations and assignments
    for (const stmt of model.stmt) {
        if (stmt.$type === 'VariableDeclaration') {
            generateExpression(stmt.value, symbols, instructions);
            const info = symbols.get(stmt.name)!;
            instructions.push(instr.local.set, localidx(info.idx));
        } else {
            // Assignment
            generateExpression(stmt.value, symbols, instructions);
            const info = symbols.get(stmt.target.ref!.name)!;
            instructions.push(instr.local.set, localidx(info.idx));
        }
    }

    // Generate instructions for each return statement
    for (const ret of model.returnStmts) {
        generateExpression(ret.expression, symbols, instructions);
    }

    return { instructions, numLocals: symbols.size, numReturns: model.returnStmts.length };
}

function generateExpression(expr: Expression, symbols: Map<string, Info>, instructions: any[]): void {
    if (isLiteral(expr)) {
        instructions.push(instr.i32.const, i32(expr.value));
    } else if (isVariableReference(expr)) {
        const info = symbols.get(expr.ref.ref!.name)!;
        instructions.push(instr.local.get, localidx(info.idx));
    } else if (isBinaryExpression(expr)) {
        generateExpression(expr.left, symbols, instructions);
        generateExpression(expr.right, symbols, instructions);
        if (expr.operator === 'add') instructions.push(instr.i32.add);
        else if (expr.operator === 'sub') instructions.push(instr.i32.sub);
        else if (expr.operator === 'mul') instructions.push(instr.i32.mul);
        else if (expr.operator === 'div') instructions.push(instr.i32.div_s);
    } else if (isNegation(expr)) {
        // Per spec, negation only applies to literals
        if (isLiteral(expr.expression)) {
            instructions.push(instr.i32.const, i32(-expr.expression.value));
        }
    } else if (isGroupExpression(expr)) {
        generateExpression(expr.expression, symbols, instructions);
    }
}
