import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { isBinaryExpression, isGroupExpression, isLiteral, isNegation, isVariableReference } from './generated/ast.js';
import type { Assignment, Expression, Literal, Program, VariableDeclaration, VariableReference, ZerowAstType } from './generated/ast.js'
import type { ZerowServices } from './zerow-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ZerowServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ZerowValidator;
    const checks: ValidationChecks<ZerowAstType> = {
        Program: validator.checkProgram
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ZerowValidator {

    checkProgram(model: Program, accept: ValidationAcceptor): void {
        this.validateProgram(model, accept);
    }


    validateProgram(model: Program, accept: ValidationAcceptor) {
        
        const declarationIndex = new Map<string, number>();
        for (let i = 0; i < model.stmt.length; i++) {
            const s = model.stmt[i];
            if (s.$type === 'VariableDeclaration') declarationIndex.set(s.name, i);
        }
        const seenNames = new Set<string>();

        function buildMeasureSet(program: Program): Set<string> {
            return new Set(program.units.map(u => u.name))
        }

        function validateStatement(stmt: VariableDeclaration | Assignment, stmtIndex: number): void {
            if (stmt.$type === 'VariableDeclaration') validateDeclarationStmt(stmt, stmtIndex);
            else validateAssignmentStmt(stmt, stmtIndex);
        }

        function validateDeclarationStmt(stmt: VariableDeclaration, stmtIndex: number): void {
                if (seenNames.has(stmt.name)) {
                    accept('error', `Variable '${stmt.name}' has already been declared.`, { node: stmt, property: 'name' });
                }
                seenNames.add(stmt.name);
                validateExpression(stmt.value, stmtIndex);
        }

        function validateAssignmentStmt(stmt: Assignment, stmtIndex: number): void {
            const targetDecl = stmt.target.ref;
            if (targetDecl) {
                const declIdx = declarationIndex.get(targetDecl.name);
                if (declIdx !== undefined && declIdx > stmtIndex) {
                    accept('error', `Variable '${targetDecl.name}' is assigned before its declaration.`, { node: stmt, property: 'target' });
                }
            }
            validateExpression(stmt.value, stmtIndex);
            const targetUnit = resolveReference(stmt.target.ref!.value);
            const valueUnit = resolveReference(stmt.value);
            if (targetUnit && valueUnit && targetUnit !== valueUnit) {
                accept('error', `Unit mismatch: expected '${targetUnit}', got '${valueUnit}'.`, { node: stmt, property: 'value' });
            }
        }

        function validateExpression(expr: Expression, stmtIndex: number): void {
            if (isLiteral(expr)) {
                validateLiteral(expr);
            } else if (isVariableReference(expr)) {
                validateReference(expr, stmtIndex);
            } else if (isBinaryExpression(expr)) {
                validateExpression(expr.left, stmtIndex);
                validateExpression(expr.right, stmtIndex);
                const leftUnit = resolveReference(expr.left);
                const rightUnit = resolveReference(expr.right);
                if (leftUnit !== rightUnit) {
                    accept('error', `Cannot '${expr.operator}' values with different units: '${leftUnit}' and '${rightUnit}'.`, { node: expr, property: 'operator' });
                }
            }
        }

        function validateLiteral(lit: Literal): void {
            if (!lit.unit.ref) {
                accept('error', `Unknown unit '${lit.unit.$refText}'.`, { node: lit, property: 'unit' });
            }
        }

        function validateReference(ref: VariableReference, stmtIndex: number): void {
            const targetDecl = ref.ref.ref;
            if (!targetDecl) return; // already reported by Langium
            const declIdx = declarationIndex.get(targetDecl.name);
            if (declIdx !== undefined && declIdx > stmtIndex) {
                accept('error', `Variable '${targetDecl.name}' is referenced before its declaration.`, { node: ref, property: 'ref' });
            }
        }

        function resolveReference(expr: Expression): string | undefined {
            if (isLiteral(expr))
                return expr.unit.ref?.name;
            if (isVariableReference(expr))
                return expr.ref.ref ? resolveReference(expr.ref.ref.value) : undefined;
            if (isGroupExpression(expr))
                return resolveReference(expr.expression);
            if (isNegation(expr))
                return resolveReference(expr.expression);
            if (isBinaryExpression(expr))
                return resolveReference(expr.left) ?? resolveReference(expr.right);
            return undefined;
        }

        for (let i = 0; i < model.stmt.length; i++) {
            validateStatement(model.stmt[i], i);
        }
    }
}
