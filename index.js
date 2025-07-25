#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import spawn from "cross-spawn";
import path from "path";

const log = console.log;
const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magentaBright;
const green = chalk.green;
const grey = chalk.grey;
const p2 = process.argv[2];
const p3 = process.argv[3];
const args = { stdio: "inherit", reject: true };
let found = false;

function $(cmd) {
    const child = spawn(cmd, p3 ? [p3] : [], args);
    child.on("error", function (err) {
        if (err.code !== "ENOENT") {
            log(err);
        }
    });
}

switch (p2) {
    case "a":
        const audit = spawn(`npm audit --json`);
        audit.on("error", function () {});
        audit.stdout.on("data", function (data) {
            const vulnerabilities = JSON.parse(data).vulnerabilities;
            if (!Object.keys(vulnerabilities).length) {
                log(green("found 0 vulnerabilities"));
            } else {
                log(magenta("Package                        Affected Range    Fix Version"));
                for (let i in vulnerabilities) {
                    const vuln = vulnerabilities[i];
                    let version = "";
                    if (vuln.fixAvailable.version) {
                        version = vuln.fixAvailable.version;
                    }
                    const vulnText = vuln.name.padEnd(31) + vuln.range.padEnd(18) + version;
                    if (vuln.severity === "low") {
                        log(vulnText);
                    } else if (vuln.severity === "moderate") {
                        log(yellow(vulnText));
                    } else {
                        log(red(vulnText));
                    }
                }
            }
        });
        break;
    case "af":
        log(yellow("npm audit fix"));
        $(`npm audit fix`);
        break;
    case "b":
        if (scripts().includes("build")) {
            log(yellow("npm run build"));
            $(`npm run build`);
        } else {
            log(yellow("ng build"));
            $(`ng build`);
        }
        break;
    case "c":
        log(yellow("cost of dependencies"));
        spawn(`npm list --json`).stdout.on("data", function (data) {
            const packNames = Object.keys(JSON.parse(data).dependencies);
            const packSizes = [];
            const dir = process.cwd();
            packNames.forEach((name) => {
                packSizes.push(getDirectorySize(`${dir}\\node_modules\\${name}`, path));
            });
            const formattedPacks = [];
            Promise.all(packSizes).then((sizes) => {
                sizes.forEach((size, i) => {
                    formattedPacks.push({ name: packNames[i], size_MB: Number((size / 1000000).toFixed(2)) });
                });
                formattedPacks.sort((a, b) => b.size_MB - a.size_MB);
                console.table(formattedPacks);
            });
        });
        break;
    case "d":
        log(yellow("Unused dependencies:"));
        spawn(`npm list --json`).stdout.on("data", function (data) {
            const packNames = Object.keys(JSON.parse(data).dependencies);
            const dir = process.cwd();
            let displayNone = true;
            packNames.forEach((name) => {
                if (!name.includes("@types/") && !name.includes("@typescript-eslint/eslint-plugin")) {
                    found = false;
                    searchInFiles(dir, name);
                    if (!found) {
                        log(red(name));
                        displayNone = false;
                    }
                }
            });
            if (displayNone) {
                log(green("none"));
            }
        });
        break;
    case "o":
        const outdated = spawn(`npm outdated --json`);
        outdated.on("error", function () {});
        outdated.stdout.on("data", function (data) {
            log(magenta("Name                                   Current   Wanted    Latest"));
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
    case "gc":
        if (p3) {
            log(yellow("ng generate component ") + magenta(p3));
            $(`ng g c`);
        } else {
            log(red("Provide component name"));
        }
        break;
    case "g":
        log(yellow("npm list ") + green("-g"));
        $(`npm ls -g`);
        break;
    case "gi":
        if (p3) {
            log(yellow("npm install ") + magenta(p3) + green(" -g"));
            $(`npm i -g`);
        } else {
            log(red("Updating..."));
            $(`npm i ng-shortcutter -g`);
        }
        break;
    case "gu":
        if (p3) {
            log(yellow("npm uninstall ") + magenta(p3) + green(" -g"));
            $(`npm un -g`);
        } else {
            log(red("Provide package name"));
        }
        break;
    case "i":
        if (p3) {
            log(yellow("npm install ") + magenta(p3));
        } else {
            log(yellow("npm install"));
        }
        $(`npm i`);
        break;
    case "id":
        if (p3) {
            log(yellow("npm install ") + magenta(p3) + green(" -D"));
            $(`npm i -D`);
        } else {
            log(red("Provide package name"));
        }
        break;
    case "un":
        if (p3) {
            log(yellow("npm uninstall ") + magenta(p3));
            $(`npm un`);
        } else {
            log(red("Provide package name"));
        }
        break;
    case "li":
        log(yellow("npm link && npm ls ") + green("-g"));
        await spawn.sync(`npm link`);
        $(`npm ls -g`);
        break;
    case "ul":
        if (p3) {
            log(yellow("npm unlink ") + magenta(p3) + green(" -g"));
            await spawn.sync(`npm unlink -g`);
        } else {
            log(red("Provide package name"));
        }
        break;
    case "up":
        log(yellow("npm update"));
        $(`npm up`);
        break;
    case "p":
        scripts(true);
        break;
    case "r":
        if (p3) {
            log(yellow("npm run ") + magenta(p3));
            $(`npm run`);
        } else {
            log(red("Provide script name"));
        }
        break;
    case "s":
        if (scripts().includes("start")) {
            log(yellow("npm run start"));
            $(`npm run start`);
        } else {
            log(yellow("ng s"));
            $(`ng s`);
        }
        break;
    case "t":
    case "j":
        if (p3) {
            log(yellow("jest ") + magenta(p3));
            $(`npx jest`);
        } else {
            log(yellow("jest --max-workers=50%"));
            $(`npx jest --max-workers=50%`);
        }
        break;
    case "tc":
    case "jc":
        if (p3) {
            log(yellow("jest ") + magenta(p3) + yellow(" --collectCoverage"));
        } else {
            log(yellow("jest --max-workers=50% --collectCoverage"));
        }
        $(`npx jest --collectCoverage`);
        break;
    case "v":
        log(yellow("ng/nvm version"));
        $(`ng v`);
        $(`nvm list`);
        break;
    case "vm":
        if (p3) {
            log(yellow("nvm install/use ") + magenta(p3));
            spawn.sync(`nvm install ${p3}`, args);
            spawn.sync(`nvm use ${p3}`, args);
            spawn(`npm i ng-shortcutter -g`, args);
        } else {
            log(yellow("nvm list"));
            spawn.sync("nvm ls", args);
            spawn.sync("nvm ls available", args);
        }
        break;
    case "k":
        if (p3) {
            const regex = new RegExp(`:${p3}.* (.+)`);
            const netstat = spawn(`netstat -ano`);
            netstat.stdout.on("data", function (data) {
                const out = data.toString();
                const match = out.match(regex);
                if (match) {
                    const TASKKILL = spawn(`TASKKILL -F -PID ${match[1]}`);
                    TASKKILL.stdout.on("data", function (TASKKILLData) {
                        log(TASKKILLData.toString());
                    });
                }
            });
        } else {
            log(red("Provide port number"));
        }
        break;
    case "l":
        if (scripts().includes("lint")) {
            log(yellow("npm run lint"));
            $(`npm run lint`);
        } else {
            log(yellow("eslint ."));
            $(`eslint .`);
        }
        break;
    case "nc":
        fs.readdir(`${process.env.LOCALAPPDATA}\\npm-cache\\_npx`, (err, files) => {
            if (files == undefined || files?.length === 0) {
                log(yellow("No npx cache to delete"));
            } else {
                fs.rm(`${process.env.LOCALAPPDATA}\\npm-cache\\_npx`, { recursive: true }, (err) => {
                    log(yellow("Npx cache deleted"));
                });
            }
        });
        break;
    default:
        if (p2) {
            const commands = scripts();
            if (commands.includes(p2)) {
                log(yellow("npm run ") + magenta(p2));
                $(`npm run ${p2}`);
            } else {
                log(magenta("    " + p2) + ": " + grey("script not found"));
                scripts(true);
            }
        } else {
            instructions();
        }
}

function scripts(show) {
    let commandsArray = [];
    const jsonString = fs.readFileSync("./package.json", "utf8");
    const packageRegex = /\"scripts\": {\s\n?(.*?)\s*}/s;
    const regexArray = packageRegex.exec(jsonString);
    if (regexArray) {
        const scripts = regexArray[1].replace(/\"|,/g, "");
        const scriptsArray = scripts.split("\n");
        const scriptsRegex = /(.*?)(: )(.*)/;
        scriptsArray.forEach((script) => {
            const commandParts = scriptsRegex.exec(script);
            if (commandParts) {
                commandsArray.push(commandParts[1].trim());
                if (show) {
                    log(red(commandParts[1]) + commandParts[2] + yellow(commandParts[3]));
                }
            } else {
                log(script);
            }
        });
    } else {
        log(red("No scripts found\n") + jsonString);
    }
    return commandsArray;
}

function instructions() {
    log(red("Shortcuts"));
    log(
        red("              s") +
            grey("│") +
            yellow("start  ") +
            red("b") +
            grey("│") +
            yellow("build  ") +
            red("t") +
            grey("│") +
            yellow("test  ") +
            red("l") +
            grey("│") +
            yellow("lint")
    );
    log(red("General                                      Package"));
    log(red("a|af") + grey("│") + yellow("audit (fix)").padEnd(50) + red("   g") + grey("│") + yellow("global list"));
    log(
        red("   c") +
            grey("│") +
            yellow("cost of dependencies").padEnd(49) +
            red("gi|gu") +
            grey("│") +
            yellow("global (un)install ") +
            magenta("package")
    );
    log(
        red("   d") +
            grey("│") +
            yellow("check unused dependencies").padEnd(50) +
            red("   i") +
            grey("│") +
            yellow("install ") +
            magenta("optional-package")
    );
    log(
        red("  gc") +
            grey("│") +
            yellow("ng generate component ") +
            magenta("component").padEnd(28) +
            red("  id") +
            grey("│") +
            yellow("install ") +
            magenta("package ") +
            green("-D")
    );
    log(red("   k") + grey("│") + yellow("kill-port").padEnd(50) + red("  un") + grey("│") + yellow("uninstall ") + magenta("package"));
    log(red("   o") + grey("│") + yellow("outdated").padEnd(50) + red("  li") + grey("│") + yellow("link"));
    log(
        red("   r") +
            grey("│") +
            yellow("npm run ") +
            magenta("script").padEnd(42) +
            red("  ul") +
            grey("│") +
            yellow("unlink ") +
            magenta("package")
    );
    log(
        red("t|tc") +
            grey("│") +
            yellow("jest (coverage) ") +
            magenta("optional-file").padEnd(34) +
            red("  up") +
            grey("│") +
            yellow("npm update")
    );
    log(red("   v") + grey("│") + yellow("ng/nvm version").padEnd(50) + red("   p") + grey("│") + yellow("display package.json scripts"));
    log(red("  vm") + grey("|") + yellow("nvm install/use ") + magenta("node-version"));
    log(red("  nc") + grey("│") + yellow("clear npx cache"));
}

function searchInFiles(dir, searchText) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            if (![".angular", ".git", "node_modules", "coverage", "dist", "docs"].includes(file.name)) {
                searchInFiles(filePath, searchText);
            }
        } else {
            if (!["package.json", "package-lock.json"].includes(file.name)) {
                try {
                    const content = fs.readFileSync(filePath, "utf8");
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
