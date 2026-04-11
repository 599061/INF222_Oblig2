import type { Program } from 'zerow-language';
import * as fs from 'node:fs';
import { extractDestinationAndName, Info, module } from './util.js';

export function generateOutput(model: Program, source: string, destination: string): string {
    const data = extractDestinationAndName(destination);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(destination, compile(model));
    return destination;
}

export function compile(model: Program) {
    const program = generateProgram(model);
    const mod = module([]);

    return Uint8Array.from(mod.flat(Infinity));
}

function generateProgram(model: Program) {
    let symbols: Map<string, Info> = new Map();
}
