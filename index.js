#!/usr/bin/env node
import chalk from "chalk";
import * as fs from "fs";
import { $ } from "execa";
import killPort from "kill-port";
import * as http from "http";

const $$ = $({ stdio: "inherit" });
const log = console.log;
const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magentaBright;
const green = chalk.green;
const grey = chalk.grey;
const p2 = process.argv[2];
const p3 = process.argv[3];

switch (p2) {
    case "a":
        const audit = $`npm audit --json`;
        audit.stdout.setEncoding("utf8");
        audit.on("error", function () {});
        audit.stdout.on("data", function (data) {
            const vulnerabilities = JSON.parse(data).vulnerabilities;
            if (!Object.keys(vulnerabilities).length) {
                log(green("found 0 vulnerabilities"));
            } else {
                log(magenta("Package                            Range/Latest"));
                import("npm-check").then((npmCheck) => {
                    npmCheck.default({ skipUnused: true }).then((currentState) => {
                        for (let i in vulnerabilities) {
                            let pack = "";
                            if (vulnerabilities[i].fixAvailable.name) {
                                pack = vulnerabilities[i].fixAvailable.name;
                            } else {
                                pack = vulnerabilities[i].nodes[0].split("/").pop();
                            }
                            let vuln = "";
                            if (pack === vulnerabilities[i].name) {
                                vuln = pack.padEnd(35) + vulnerabilities[i].range.padEnd(10);
                            } else {
                                vuln = pack + "\n" + ("    " + vulnerabilities[i].name).padEnd(35) + vulnerabilities[i].range.padEnd(10);
                            }
                            if (vulnerabilities[i].fixAvailable === true) {
                                vuln = vuln + " <- npm audit fix";
                            }
                            if (vulnerabilities[i].isDirect || vulnerabilities[i].fixAvailable.name) {
                                switch (vulnerabilities[i].severity) {
                                    case "critical":
                                    case "high":
                                        log(red(vuln));
                                        break;
                                    case "moderate":
                                        log(yellow(vuln));
                                        break;
                                    case "low":
                                        log(green(vuln));
                                        break;
                                    default:
                                        log(vuln);
                                }
                                currentState.get("packages").forEach((pack) => {
                                    if (vulnerabilities[i].name === pack.moduleName) {
                                        log("".padEnd(35) + pack.latest);
                                    }
                                });
                            } else {
                                log(grey(vuln));
                            }
                            log(grey("─".repeat(process.stdout.columns)));
                        }
                    });
                });
            }
        });
        break;
    case "af":
        log(yellow("npm audit fix"));
        $$`npm audit fix`;
        break;
    case "b":
        if (scripts().includes("build")) {
            log(yellow("npm run build"));
            $$`npm run build`;
        } else {
            log(yellow("ng build"));
            $$`ng build`;
        }
        break;
    case "c":
        log(yellow("cost-of-modules ") + green("--no-install --include-dev"));
        $$`cost-of-modules --no-install --include-dev`;
        break;
    case "d":
        log(yellow("depcheck"));
        import("depcheck4").then((depcheck) => {
            depcheck
                .default(process.cwd(), { ignoreMatches: ["tslib", "@types/*", "@angular-eslint/*", "@typescript-eslint/*"] })
                .then((unused) => {
                    if (unused.dependencies.length !== 0) {
                        log("Unused dependencies\n", unused.dependencies);
                    }
                    if (unused.devDependencies.length !== 0) {
                        log("Unused devDependencies\n", unused.devDependencies);
                    }
                    log(green("depcheck done"));
                });
        });
        break;
    case "o":
    case "oo":
        log(magenta("Name                              Current   Wanted    Latest    Homepage"));
        import("npm-check").then((npmCheck) => {
            npmCheck.default({ skipUnused: true }).then((currentState) => {
                let anyOutdated = false;
                let outdatedList = [];
                currentState.get("packages").forEach((pack) => {
                    if (!pack.pkgError && !pack.notInPackageJson) {
                        let outdated =
                            pack.moduleName.padEnd(34) +
                            pack.installed.padEnd(10) +
                            pack.packageWanted.padEnd(10) +
                            pack.latest.padEnd(10) +
                            "https://npmjs.com/package/" +
                            pack.moduleName;
                        outdatedList.push(outdated);
                        if (pack.installed !== pack.latest) {
                            if (pack.installed === pack.packageWanted) {
                                log(red(outdated));
                            } else {
                                log(yellow(outdated));
                            }
                            anyOutdated = true;
                        } else {
                            if (p2 === "oo") {
                                log(green(outdated));
                            }
                        }
                    }
                });
                if (!anyOutdated && p2 !== "oo") {
                    outdatedList.forEach((outdated) => {
                        log(green(outdated));
                    });
                }
            });
        });
        break;
    case "gc":
        if (p3) {
            log(yellow("git cherry-pick ") + magenta(p3));
            $$`git cherry-pick ${p3}`;
        } else {
            log(red("Usage") + grey("│"));
            log(red("   gc") + grey("│") + yellow("git cherry-pick ") + magenta("commit-hash"));
        }
        break;
    case "g":
        log(yellow("npm list ") + green("-g"));
        $$`npm ls -g`;
        break;
    case "gi":
        log(yellow("npm install ") + magenta(p3) + green(" -g"));
        $$`npm i ${p3} -g`;
        break;
    case "gu":
        log(yellow("npm uninstall ") + magenta(p3) + green(" -g"));
        $$`npm un ${p3} -g`;
        break;
    case "i":
        if (p3) {
            log(yellow("npm install ") + magenta(p3));
            $$`npm i ${p3}`;
        } else {
            log(yellow("npm install"));
            $$`npm i`;
        }
        break;
    case "id":
        log(yellow("npm install ") + magenta(p3) + green(" -D"));
        $$`npm i -D ${p3}`;
        break;
    case "un":
        log(yellow("npm uninstall ") + magenta(p3));
        $$`npm un ${p3}`;
        break;
    case "li":
        log(yellow("npm link && npm ls ") + green("-g"));
        await $$`npm link`;
        $$`npm ls -g`;
        break;
    case "ul":
        if (p3) {
            log(yellow("npm unlink ") + magenta(p3) + green(" -g"));
            $$`npm unlink ${p3} -g`;
        } else {
            log(red("Usage") + grey("│"));
            log(red("   ul") + grey("│") + yellow("npm unlink ") + magenta("package"));
        }
        break;
    case "up":
        log(yellow("npm update"));
        $$`npm up`;
        break;
    case "p":
        scripts(true);
        break;
    case "r":
        if (p3) {
            log(yellow("npm run ") + magenta(p3));
            $$`npm run ${p3}`;
        } else {
            log(red("Usage") + grey("│"));
            log(red("    r") + grey("│") + yellow("npm run ") + magenta("script-name"));
        }
        break;
    case "s":
        if (scripts().includes("start")) {
            log(yellow("npm run start"));
            $$`npm run start`;
        } else {
            log(yellow("ng s"));
            $$`ng s`;
        }
        break;
    case "t":
    case "j":
        if (!p3) {
            log(yellow("jest --max-workers=50%"));
            $$`jest --max-workers=50%`;
        } else {
            log(yellow("jest ") + magenta(p3));
            $$`jest ${p3}`;
        }
        break;
    case "tc":
    case "jc":
        if (!p3) {
            log(yellow("jest --max-workers=50% --collectCoverage"));
            $$`jest --collectCoverage`;
        } else {
            log(yellow("jest ") + magenta(p3) + yellow(" --collectCoverage"));
            $$`jest ${p3} --collectCoverage`;
        }
        break;
    case "v":
        log(yellow("ng version"));
        $$`nvm list`;
        $$`ng v`;
        break;
    case "k":
        if (p3) {
            log(yellow("kill-port ") + magenta(p3));
            http.createServer().listen(p3, () => {
                killPort(p3, "tcp").then(console.log).catch(console.log);
            });
        } else {
            log(yellow("none"));
        }
        break;
    case "l":
        if (scripts().includes("lint")) {
            log(yellow("npm run lint"));
            $$`npm run lint`;
        } else {
            log(yellow("eslint ."));
            $$`eslint .`;
        }
        break;
    default:
        if (p2) {
            const commands = scripts();
            if (commands.includes(p2)) {
                log(yellow("npm run ") + magenta(p2));
                $$`npm run ${p2}`;
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
    log(red("a/af") + grey("│") + yellow("audit/audit fix").padEnd(50) + red("   g") + grey("│") + yellow("global list"));
    log(
        red("   c") +
            grey("│") +
            yellow("cost-of-modules ").padEnd(49) +
            red("gi/gu") +
            grey("│") +
            yellow("global (un)install ") +
            magenta("package")
    );
    log(
        red("   d") +
            grey("│") +
            yellow("depcheck ").padEnd(50) +
            red("   i") +
            grey("│") +
            yellow("install ") +
            magenta("optional-package")
    );
    log(
        red("  gc") +
            grey("│") +
            yellow("git cherry-pick ") +
            magenta("commit-hash").padEnd(34) +
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
        red("t/tc") +
            grey("│") +
            yellow("jest/coverage ") +
            magenta("optional-file").padEnd(36) +
            red("  up") +
            grey("│") +
            yellow("npm update")
    );
    log(red("   v") + grey("│") + yellow("ng version").padEnd(50) + red("   p") + grey("│") + yellow("display package.json scripts"));
}
