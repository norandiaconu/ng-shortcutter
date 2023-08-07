#!/usr/bin/env node
import spawn from "cross-spawn";
import chalk from "chalk";
import depcheck from "depcheck4";
import * as fs from "fs";
import npmCheck from "npm-check";

const inherit = { stdio: "inherit" };
const log = console.log;
const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magenta;
const green = chalk.green;
const grey = chalk.grey;
const p2 = process.argv[2];
const p3 = process.argv[3];

switch(p2) {
  case "a":
    const audit = spawn("npm audit --json");
    audit.stdout.setEncoding("utf8");
    audit.on("error", function() {});
    audit.stdout.on("data", function(data) {
      const vulnerabilities = JSON.parse(data).vulnerabilities;
      if (!Object.keys(vulnerabilities).length) {
        log(green("found 0 vulnerabilities"));
      } else {
        log(magenta("Package                            Range"));
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
          switch(vulnerabilities[i].severity) {
            case "critical":
              log(magenta(vuln));
              break;
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
          log(grey('─'.repeat(process.stdout.columns)));
        }
      }
    });
    break;
  case "b":
    log(yellow("ng build"));
    spawn("ng build", inherit);
    break;
  case "c":
    log(yellow("cost-of-modules ") + green("--no-install --include-dev"));
    spawn("cost-of-modules --no-install --include-dev", inherit);
    break;
  case "d":
    log(yellow("depcheck"));
    depcheck(process.cwd(), { ignoreMatches: ["tslib", "@types/*", "@angular-eslint/*", "@typescript-eslint/*"] }).then(unused => {
      if (unused.dependencies.length !== 0) {
        log("Unused dependencies\n", unused.dependencies);
      }
      if (unused.devDependencies.length !== 0) {
        log("Unused devDependencies\n", unused.devDependencies);
      }
      log(green("depcheck done"));
    });
    break;
  case "o":
  case "oo":
    npmCheck({skipUnused: true})
      .then(currentState => {
        log(magenta("Name                              Current   Wanted    Latest    Homepage"));
        currentState.get('packages').forEach(pack => {
          if (!pack.pkgError && !pack.notInPackageJson) {
            let outdated = pack.moduleName.padEnd(34) + pack.installed.padEnd(10) + pack.packageWanted.padEnd(10) + pack.latest.padEnd(10)
              + "https://npmjs.com/package/" + pack.moduleName;
            if (pack.installed !== pack.latest) {
              if (pack.installed === pack.packageWanted) {
                log(red(outdated));
              } else {
                log(yellow(outdated));
              }
            } else {
              if (p2 === "oo") {
                log(green(outdated));
              }
            }
          }
        });
      });
      break;
  case "gc":
    if (p3) {
      log(yellow("git cherry-pick ") + magenta(p3));
      spawn("git cherry-pick", [p3], inherit);
    } else {
      log(red("Usage") + grey("│"));
      log(red("   gc") + grey("│") + yellow("git cherry-pick ") + magenta("commit-hash"));
    }
    break;
  case "g":
    log(yellow("npm list ") + green("-g"));
    spawn("npm ls -g", inherit);
    break;
  case "gi":
    log(yellow("npm install ") + magenta(p3) + green(" -g"));
    spawn("npm i -g", [p3], inherit);
    break;
  case "gu":
    log(yellow("npm uninstall ") + magenta(p3) + green(" -g"));
    spawn("npm un -g", [p3], inherit);
    break;
  case "i":
    log(yellow("npm install ") + magenta(p3));
    spawn("npm i", [p3], inherit);
    break;
  case "id":
    log(yellow("npm install ") + magenta(p3) + green(" -D"));
    spawn("npm i -D", [p3], inherit);
    break;
  case "un":
    log(yellow("npm uninstall ") + magenta(p3));
    spawn("npm un ", [p3], inherit);
    break;
  case "l":
    log(yellow("npm link && npm ls ") + green("-g"));
    spawn("npm link && npm ls -g", inherit);
    break;
  case "ul":
    if (p3) {
      log(yellow("npm unlink ") + magenta(p3) + green(" -g"));
      spawn("npm unlink -g", [p3], inherit);
    } else {
      log(red("Usage") + grey("│"));
      log(red("   ul") + grey("│") + yellow("npm unlink ") + magenta("package"));
    }
    break;
  case "p":
    fs.readFile("./package.json", "utf8", (err, jsonString) => {
      const packageRegex = /\"scripts\": {\s\n?(.*?)\s*},/s;
      const regexArray = packageRegex.exec(jsonString);
      if (regexArray) {
        const scripts = regexArray[1].replace(/\"|,/g, "");
        const scriptsArray = scripts.split("\n");
        const scriptsRegex = /(.*?)(: )(.*)/;
        scriptsArray.forEach(script => {
          const commandParts = scriptsRegex.exec(script);
          if (commandParts) {
            log(red(commandParts[1]) + commandParts[2] + yellow(commandParts[3]));
          } else {
            log(script);
          }
        });
      } else {
        log(red("No scripts found\n") + jsonString);
      }
    });
    break;
  case "s":
    log(yellow("ng serve"));
    spawn("ng s", inherit);
    break;
  case "t":
    if (!p3) {
      log(yellow("ng test"));
      spawn("ng test", inherit);
    } else {
      log(yellow("ng test --include=**\\") + magenta(p3) + yellow(".component.spec.ts --include=**\\") + magenta(p3)
        + yellow(".service.spec.ts --no-sandbox"));
      spawn("ng test --code-coverage --include=**\\" + p3 + ".component.spec.ts --include=**\\"+ p3 + ".service.spec.ts", inherit);
    }
    break;
  case "v":
    log(yellow("ng version"));
    spawn("ng v", inherit);
    break;
  default:
    log(red("General Shortcuts                            Package Shortcuts"));
    log(red("   a") + grey("│") + yellow("audit").padEnd(50)
      + red("   g") + grey("│") + yellow("global list"));
    log(red("   b") + grey("│") + yellow("ng build").padEnd(50)
      + red("  gi") + grey("│") + yellow("global install ") + magenta("package-name"));
    log(red("   c") + grey("│") + yellow("cost-of-modules ").padEnd(50)
      + red("  gu") + grey("│") + yellow("global uninstall ") + magenta("package-name"));
    log(red("   d") + grey("│") + yellow("depcheck ").padEnd(50)
      + red("   i") + grey("│") + yellow("install ") + magenta("package-name"));
    log(red("  gc") + grey("│") + yellow("git cherry-pick ") + magenta("commit-hash").padEnd(34)
      + red("  id") + grey("│") + yellow("install ") + magenta("package-name ") + green("-D"));
    log(red("   o") + grey("│") + yellow("outdated").padEnd(50)
      + red("  un") + grey("│") + yellow("uninstall ") + magenta("package-name"));
    log(red("   s") + grey("│") + yellow("ng serve").padEnd(50)
      + red("   l") + grey("│") + yellow("link"));
    log(red("   t") + grey("│") + yellow("ng test ") + magenta("optional-file-name") + green(".spec.ts").padEnd(24)
      + red("  ul") + grey("│") + yellow("unlink ") + magenta("package-name"));
    log(red("   v") + grey("│") + yellow("ng version").padEnd(50)
      + red("   p") + grey("│") + yellow("display scripts from package.json"));
}
