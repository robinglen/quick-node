import colors from "colors/safe";
import childProcess from "child_process";
import fs from "fs";
import prompt from "prompt";
import request from "request";
import util from "util";

const rp = util.promisify(request);
const ep = util.promisify(childProcess.exec);
const pp = util.promisify(prompt.get);

async function createGitIgnore(url) {
  console.log(`Fetching gitignore from ${url}`);
  let response;
  try {
    response = await rp(url);
    console.log(`Writing .gitignore`);
    fs.writeFileSync("./app/.gitignore", response.body);
  } catch (err) {
    console.log("Error - failed to get gitignore.io");
    console.log("Writing .gitignore from backup");
    fs.copyFileSync("./templates/.gitignore", "./app/.gitignore");
  }
}

// this is the pattern i want to move to but is not working
function updateTemplate(path, values) {
  const template = fs.readFileSync(path, "utf8");
  let populatedTemplate = template;

  values.forEach(value => {
    const regex = new RegExp(value.regex);
    populatedTemplate.replace(regex, 11234);
  });

  console.log(populatedTemplate);
  return populatedTemplate;
}

// this DRY version is not working
function createLicense() {
  const year = new Date().getFullYear();
  const license = updateTemplate("./templates/LICENSE", [
    {
      regex: /{year}/gim,
      value: year
    }
  ]);
  console.log(`Writing LICENSE for ${year}`);
  fs.writeFileSync("./app/LICENSE", license);
}

function createReadme(name, description) {
  const readmeTemplate = fs.readFileSync("./templates/README.md", "utf8");
  let readme = readmeTemplate.replace(/{name}/gim, name);
  readme = readme.replace(/{description}/gim, description);
  console.log(`Writing README for ${name}`);
  fs.writeFileSync("./app/README.md", readme);
}

function createPackage(name, description) {
  const project = name.replace(/ /gim, "-").toLowerCase();
  const packageTemplate = fs.readFileSync("./templates/package.json", "utf8");
  let packageFile = packageTemplate.replace(/{name}/gim, name);
  packageFile = packageFile.replace(/{description}/gim, description);
  packageFile = packageFile.replace(/{project}/gim, project);
  console.log(`Writing package.json for ${name}`);
  fs.writeFileSync("./app/package.json", packageFile);
}

function createNVMRC() {
  console.log(`Writing .nvmrc for node ${process.version}`);
  fs.writeFileSync("./app/.nvmrc", process.version);
}

async function gitSetUp() {
  // not sure can call git in exec
  const { stdout, stderr } = await ep("git");
  console.log("stdout:", stdout);
  console.log("stderr:", stderr);
}

function init() {
  prompt.message = colors.cyan("quick-node");
  prompt.delimiter = colors.white(": ");

  prompt.start();

  pp({
    properties: {
      name: {
        description: colors.cyan("name")
      },
      description: {
        description: colors.cyan("description")
      }
    }
  })
    .then(result => {
      createReadme(result.name, result.description);
      createPackage(result.name, result.description);
      createLicense();
      createNVMRC();
      createGitIgnore("https://www.gitignore.io/api/osx,node");
      // gitSetUp();
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    });
}
init();
