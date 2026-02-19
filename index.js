#!/usr/bin/env node
import chalk from 'chalk';
import fs from 'fs';
import spawn from 'cross-spawn';
import path from 'path';
import readline from 'readline';
import yoctoSpinner from 'yocto-spinner';
import CG from 'console-grid';
import { exec } from 'child_process';

const spinner = yoctoSpinner();
const log = console.log;
const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magentaBright;
const green = chalk.green;
const grey = chalk.hex('#353535');
const p2 = process.argv[2];
const p3 = process.argv[3];
const args = { stdio: 'inherit', reject: true };
let found = false;
const options = {
    defaultMaxWidth: 60,
    nullPlaceholder: '',
    borderH: grey('─'),
    borderV: grey('│'),
    borderTL: grey('┌'),
    borderTC: grey('┬'),
    borderTR: grey('┐'),
    borderCL: grey('├'),
    borderCC: grey('┼'),
    borderCR: grey('┤'),
    borderBL: grey('└'),
    borderBC: grey('┴'),
    borderBR: grey('┘')
};

function $(cmd) {
    const child = spawn(cmd, p3 ? [p3] : [], args);
    child.on('error', function (err) {
        if (err.code !== 'ENOENT') {
            log(err);
        }
    });
}

switch (p2) {
    case 'a':
        audit();
        break;
    case 'af':
        process.stdout.write(yellow('npm audit fix...'));
        spawn.sync(`npm audit fix`);
        log(yellow(' DONE'));
        audit();
        break;
    case 'b':
        if (scripts().includes('build')) {
            log(yellow('npm run build'));
            $(`npm run build`);
        } else {
            log(yellow('ng build'));
            $(`ng build`);
        }
        break;
    case 'c':
        spinner.start(yellow('cost of dependencies'));
        spawn(`npm list --json`).stdout.on('data', function (data) {
            const packNames = Object.keys(JSON.parse(data).dependencies);
            const packSizes = [];
            const dir = process.cwd();
            packNames.forEach((name) => {
                packSizes.push(getDirectorySize(`${dir}\\node_modules\\${name}`, path));
            });
            const formattedPacks = [];
            Promise.all(packSizes).then((sizes) => {
                let totalSize = 0;
                sizes.forEach((size, i) => {
                    const formattedSize = Number((size / 1000000).toFixed(2));
                    formattedPacks.push({ name: packNames[i], size: formattedSize });
                    totalSize += formattedSize;
                });
                formattedPacks.sort((a, b) => b.size - a.size);
                let rows = [];
                formattedPacks.forEach((pack) => {
                    rows.push([green(pack.name), yellow(pack.size.toFixed(2))]);
                });
                rows.push([yellow('Count: ') + red(rows.length), yellow('Total: ') + red(totalSize.toFixed(2) + ' MB')]);
                spinner.stop();
                CG({
                    columns: [green('Name'), yellow('Size (MB)')],
                    rows: rows,
                    options: options
                });
            });
        });
        break;
    case 'd':
        spinner.start(yellow('Unused dependencies'));
        spawn(`npm list --json`).stdout.on('data', function (data) {
            const packNames = Object.keys(JSON.parse(data).dependencies);
            const dir = process.cwd();
            let displayNone = true;
            spinner.stop();
            packNames.forEach((name) => {
                if (!name.includes('@types/') && !name.includes('@typescript-eslint/eslint-plugin')) {
                    found = false;
                    searchInFiles(dir, name);
                    if (!found) {
                        log(red(name));
                        displayNone = false;
                    }
                }
            });
            if (displayNone) {
                log(green('none'));
            }
        });
        break;
    case 'de':
        log(yellow('npm dedupe'));
        $(`npm dedupe`);
        break;
    case 'o':
        spinner.start(yellow('npm outdated'));
        const outdated = spawn(`npm outdated --json`);
        outdated.on('error', function () {});
        outdated.stdout.on('data', function (data) {
            spinner.stop();
            log(magenta('Name                                   Current   Wanted    Latest'));
            const out = JSON.parse(data);
            Object.keys(out).forEach((key) => {
                const outText = key.padEnd(39) + out[key].current.padEnd(10) + out[key].wanted.padEnd(10) + out[key].latest;
                if (out[key].current === out[key].wanted) {
                    log(yellow(outText));
                } else {
                    log(red(outText));
                }
            });
        });
        break;
    case 'gc':
        if (p3) {
            log(yellow('ng generate component ') + magenta(p3));
            $(`ng g c`);
        } else {
            log(red('Provide component name'));
        }
        break;
    case 'g':
        log(yellow('npm list ') + green('-g'));
        $(`npm ls -g`);
        break;
    case 'gi':
        if (p3) {
            log(yellow('npm install ') + magenta(p3) + green(' -g'));
            $(`npm i -g`);
        } else {
            log(red('Updating...'));
            $(`npm i ng-shortcutter -g`);
        }
        break;
    case 'gu':
        if (p3) {
            log(yellow('npm uninstall ') + magenta(p3) + green(' -g'));
            $(`npm un -g`);
        } else {
            log(red('Provide package name'));
        }
        break;
    case 'i':
        if (p3) {
            log(yellow('npm install ') + magenta(p3));
        } else {
            log(yellow('npm install'));
        }
        $(`npm i`);
        break;
    case 'ci':
        log(yellow('npm clean-install'));
        $(`npm ci`);
        break;
    case 'id':
        if (p3) {
            log(yellow('npm install ') + magenta(p3) + green(' -D'));
            $(`npm i -D`);
        } else {
            log(red('Provide package name'));
        }
        break;
    case 'un':
        if (p3) {
            log(yellow('npm uninstall ') + magenta(p3));
            $(`npm un`);
        } else {
            log(red('Provide package name'));
        }
        break;
    case 'li':
        log(yellow('npm link && npm ls ') + green('-g'));
        spawn.sync(`npm link`);
        $(`npm ls -g`);
        break;
    case 'ul':
        if (p3) {
            log(yellow('npm unlink ') + magenta(p3) + green(' -g'));
            spawn.sync(`npm unlink -g`);
        } else {
            log(red('Provide package name'));
        }
        break;
    case 'up':
        log(yellow('npm update'));
        $(`npm up`);
        break;
    case 'p':
        scripts(true);
        break;
    case 'r':
        if (p3) {
            log(yellow('npm run ') + magenta(p3));
            $(`npm run`);
        } else {
            log(red('Provide script name'));
        }
        break;
    case 's':
        if (scripts().includes('start')) {
            log(yellow('npm run start'));
            $(`npm run start`);
        } else {
            log(yellow('ng s'));
            $(`ng s`);
        }
        break;
    case 't':
        process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
        log(yellow('test ') + magenta(p3 ? p3 : ''));
        if (fs.existsSync('./vitest.config.ts')) {
            $(`npx vitest run --config vitest.config.ts --no-coverage`);
        } else {
            $(`npm run test`);
        }
        break;
    case 'tc':
        process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
        log(yellow('test ') + magenta(p3 ? p3 : ''));
        if (fs.existsSync('./vitest.config.ts')) {
            $(`npx vitest run --config vitest.config.ts`);
        } else {
            $(`npm run test`);
        }
        break;
    case 'v':
        if (p3) {
            spinner.start(yellow(`npm view ${p3} versions`));
            spawn('npm', ['view', p3, 'versions']).stdout.on('data', function (data) {
                const versions = data
                    .toString()
                    .replace(/'| |\[|\]|\n/g, '')
                    .split(',');
                const start = versions.length > 99 ? versions.length - 99 : 0;
                spinner.stop();
                process.stdout.write(red(versions[0].replace(/,/g, '')) + grey('│'));
                for (let i = start; i < versions.length - 1; i++) {
                    process.stdout.write(yellow(versions[i].replace(/,/g, '')) + grey('│'));
                    if (i !== 0 && i % 16 === 0) {
                        log();
                    }
                }
                log(green(versions[versions.length - 1].replace(/,/g, '')));
            });
        } else {
            log(yellow('ng/nvm version'));
            $(`ng v`);
            $(`nvm list`);
        }
        break;
    case 'vm':
        if (p3) {
            exec('net session', function (err) {
                if (err) {
                    log(red('Rerun as admin'));
                }
            });
            log(yellow('nvm install/use ') + magenta(p3));
            spawn.sync(`nvm install ${p3}`, args);
            spawn.sync(`nvm use ${p3}`, args);
            log(yellow('npm i ng-shortcutter -g'));
            await wait('Press ENTER to continue...');
            spawn(`npm i ng-shortcutter -g`, args);
        } else {
            log(yellow('nvm list'));
            spawn.sync('nvm ls', args);
            spawn.sync('nvm ls available', args);
        }
        break;
    case 'k':
        const port = p3 ? p3 : await wait(red('Provide port number: '));
        if (port) {
            const regex = new RegExp(`:${port}.* (.+)`);
            const netstat = spawn(`netstat -ano`);
            netstat.stdout.on('data', function (data) {
                const out = data.toString();
                const match = out.match(regex);
                if (match) {
                    const TASKKILL = spawn(`TASKKILL -F -PID ${match[1]}`);
                    TASKKILL.stdout.on('data', function (TASKKILLData) {
                        log(TASKKILLData.toString());
                    });
                }
            });
        }
        break;
    case 'l':
        if (scripts().includes('lint')) {
            log(yellow('npm run lint'));
            $(`npm run lint`);
        } else {
            log(yellow('eslint .'));
            $(`eslint .`);
        }
        break;
    case 'nc':
        fs.readdir(`${process.env.LOCALAPPDATA}\\npm-cache\\_npx`, (err, files) => {
            if (files == undefined || files?.length === 0) {
                log(yellow('No npx cache to delete'));
            } else {
                process.stdout.write(green('Installed npx packages') + grey(' │ '));
                files.forEach((file) => {
                    fs.readFile(
                        `${process.env.LOCALAPPDATA}\\npm-cache\\_npx\\${file}\\package.json`,
                        { encoding: 'utf-8' },
                        function (err, data) {
                            const regex = new RegExp(`"dependencies.*\n.*?"(.*?)"`);
                            const match = data.match(regex);
                            process.stdout.write(yellow(match[1]) + grey(' │ '));
                        }
                    );
                });
                setTimeout(async () => {
                    log();
                    const response = await wait(red('Delete (y/N)') + ': ');
                    if (response === 'y') {
                        fs.rm(`${process.env.LOCALAPPDATA}\\npm-cache\\_npx`, { recursive: true }, (err) => {
                            log(yellow('Npx cache deleted'));
                        });
                    }
                }, 100);
            }
        });
        break;
    default:
        if (p2) {
            const commands = scripts();
            if (commands.includes(p2)) {
                log(yellow('npm run ') + magenta(p2));
                $(`npm run ${p2}`);
            } else {
                log(magenta('    ' + p2) + ': ' + grey('script not found'));
                scripts(true);
            }
        } else {
            instructions();
        }
}

function scripts(show, skipLog) {
    let commandsArray = [];
    const jsonString = fs.readFileSync('./package.json', 'utf8');
    const packageRegex = /\"scripts\": {\s\n?(.*?)\s*}/s;
    const regexArray = packageRegex.exec(jsonString);
    if (regexArray) {
        const scripts = regexArray[1].replace(/\"|,/g, '');
        const scriptsArray = scripts.split('\n');
        const scriptsRegex = /(.*?)(: )(.*)/;
        let rows = [];
        scriptsArray.forEach((script) => {
            const commandParts = scriptsRegex.exec(script);
            if (commandParts) {
                const trimmedCommand = commandParts[1].trim();
                commandsArray.push(trimmedCommand);
                if (show) {
                    rows.push([red(trimmedCommand), yellow(commandParts[3])]);
                }
            } else {
                log(script);
            }
        });
        if (rows.length) {
            CG({
                columns: [red('Command'), yellow('Script')],
                rows: rows,
                options: options
            });
        }
    } else {
        if (!skipLog) {
            log(red('No scripts found\n') + jsonString);
        }
    }
    return commandsArray;
}

function instructions() {
    // prettier-ignore
    log(
        red('ng-shortcutter').padEnd(44) +
            red('i') + grey('│') + yellow('install     ') +
            red('s') + grey('│') + yellow('start     ') +
            red('b') + grey('│') + yellow('build     ') +
            red('t') + grey('│') + yellow('test     ') +
            red('l') + grey('│') + yellow('lint')
    );
    // prettier-ignore
    let rows = [
        [cell('a|af', 'audit (fix)'),              cell('i|ci', '(clean) install', 'pkg?'), cell('g', 'global list')],
        [cell('c', 'cost of dependencies'),        cell('id', 'install', 'pkg -D'),         cell('gi|gu', 'global (un)install', 'pkg')],
        [cell('d', 'unused dependencies'),         cell('un', 'uninstall', 'pkg'),          cell('k', 'kill port')],
        [cell('gc', 'generate component', 'name'), cell('li|ul', '(un)link', 'pkg'),        cell('nc', 'clear npx cache')],
        [cell('o', 'outdated'),                    cell('up', 'npm update'),                cell('v', 'ng/nvm version')],
        [cell('r', 'npm run', 'script'),           cell('p', 'package.json scripts'),       cell('vm', 'nvm install/use', 'version')],
        [cell('t|tc', 'test (coverage)', 'file?'), cell('de', 'dedupe'),                    ''],
    ];

    const commands = scripts(false, true);
    if (commands.length) {
        if (commands.length < 8) {
            for (let i = 0; i < commands.length; i++) {
                rows[i].push(red(commands[i]));
            }
        } else {
            for (let i = 0; i < 6; i++) {
                rows[i].push(red(commands[i]));
            }
            rows[6].push(red('<MORE>'));
        }
    } else {
        rows[0].push(red('<NONE>'));
    }
    CG({
        columns: [red('General'), red('Package'), red('Global'), green('Scripts')],
        rows: rows,
        options: options
    });
}

function searchInFiles(dir, searchText) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            if (!['.angular', '.git', 'node_modules', 'coverage', 'dist', 'docs'].includes(file.name)) {
                searchInFiles(filePath, searchText);
            }
        } else {
            if (!['package.json', 'package-lock.json'].includes(file.name)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (content.includes(searchText)) {
                        found = true;
                    }
                } catch (err) {
                    log(`Error reading file: ${filePath}`);
                }
            }
        }
    }
}

async function getDirectorySize(dirPath, path) {
    let totalSize = 0;
    async function calculateSize(itemPath) {
        const stats = await fs.promises.stat(itemPath);
        if (stats.isFile()) {
            totalSize += stats.size;
        } else if (stats.isDirectory()) {
            const items = await fs.promises.readdir(itemPath);
            await Promise.all(items.map((item) => calculateSize(path.join(itemPath, item))));
        }
    }
    await calculateSize(dirPath);
    return totalSize;
}

function wait(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

function audit() {
    spinner.start(yellow('npm audit'));
    const audit = spawn(`npm audit --json`);
    audit.on('error', function () {});
    audit.stdout.on('data', function (data) {
        const vulnerabilities = JSON.parse(data).vulnerabilities;
        if (!Object.keys(vulnerabilities).length) {
            spinner.stop();
            log(green('found 0 vulnerabilities'));
        } else {
            spinner.stop();
            log(magenta('Package                        Affected Range    Fix Version'));
            let totalLow = 0;
            let totalMed = 0;
            let totalHigh = 0;
            for (let i in vulnerabilities) {
                const vuln = vulnerabilities[i];
                let version = '';
                if (vuln.fixAvailable.version) {
                    version = vuln.fixAvailable.version;
                }
                const vulnText = vuln.name.padEnd(31) + vuln.range.padEnd(18) + version;
                if (vuln.severity === 'low') {
                    log(green(vulnText));
                    totalLow++;
                } else if (vuln.severity === 'moderate') {
                    log(yellow(vulnText));
                    totalMed++;
                } else {
                    log(red(vulnText));
                    totalHigh++;
                }
            }
            log(yellow('Total: ') + green(totalLow + ' low ') + yellow(totalMed + ' medium ') + red(totalHigh + ' high'));
        }
    });
}

function cell(c1, c2, c3) {
    return ''.padEnd(5 - c1.length) + red(c1) + grey('│') + yellow(c2) + magenta(c3 ? ' ' + c3 : '');
}
