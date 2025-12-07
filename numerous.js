#!/usr/bin/env node
import concurrently from 'concurrently';

let commands = [];
if (process.argv[3]) {
    for (let i = 2; i < process.argv.length; i++) {
        commands.push(`n ${process.argv[i]}`);
    }
} else {
    const p2 = process.argv[2];
    for (let i = 0; i < p2.length; i++) {
        commands.push(`n ${p2.charAt(i)}`);
    }
}
concurrently(commands, { maxProcesses: process.argv[2].charAt(0) === 'i' ? 1 : process.argv.length, prefix: 'none' });
