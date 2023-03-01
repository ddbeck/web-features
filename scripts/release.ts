import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";

import winston from "winston";
import yargs from "yargs";

const loggerTransport = new winston.transports.Console({ level: "silly" });
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [loggerTransport],
});

const packages = {
  "web-features": "./packages/web-features",
};

yargs(process.argv.slice(2))
  .scriptName("release")
  .usage("$0 <cmd> [args]")
  .command({
    command: "init",
    describe: "Start a new release pull request",
    builder: (yargs) => {
      return yargs
        .positional("semverlevel", {
          describe: "the Semantic Versioning level for the release",
          choices: ["major", "minor", "patch", "prerelease"],
          default: "patch",
        })
        .demandOption("semverlevel", "You must provide a semver level");
    },
    handler: init,
  })
  .command({
    command: "update",
    describe: "Update an existing release pull request",
    builder: (yargs) => {
      return yargs
        .positional("pr", {
          describe: "the PR to rebase and update",
        })
        .demandOption("pr");
    },
    handler: update,
  })
  .command({
    command: "publish",
    describe: "Publish the package to npm",
    builder: (yargs) => {
      return yargs
        .positional("pr", {
          describe: "the PR to rebase and update",
        })
        .demandOption("pr");
    },
    handler: publish,
  }).argv;

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit" });
}

function init(args) {
  logger.info("Running preflight checks");

  // Confirm base branch
  logger.info("Checking base branch");
  const headCmd = "git rev-parse --abbrev-ref HEAD";
  logger.debug(headCmd);
  const head = execSync(headCmd, { encoding: "utf-8" }).trim();

  if (head !== "main") {
    logger.warn("Base banch is not main");
  }

  // Make sure gh CLI is installed and has auth
  logger.info("Confirming gh CLI is present and authorized");
  const ghVersionCmd = "gh version";
  try {
    logger.debug(ghVersionCmd);
    execSync(ghVersionCmd);
  } catch (err) {
    logger.error("gh CLI failed to run. Do you have it installed?", err.error);
    process.exit(1);
  }

  const ghAuthStatus = "gh auth status";
  try {
    logger.debug(ghAuthStatus);
    run(ghAuthStatus);
  } catch (err) {
    logger.error(
      "`gh auth status` was non-zero. Try running `gh auth login` or `gh auth refresh` and try again.",
      err.error
    );
    logger.error(err.stderr);
    process.exit(1);
  }

  // Start a release branch
  // Convention borrowed from https://github.com/w3c/webref/blob/60ebf71b9d555c523975cfefb08f5420d12b7293/tools/prepare-release.js#L164-L165
  const releaseBranch = `release-${new Date()
    .toISOString()
    .replace(/[\-T:\.Z]/g, "")}`;
  logger.info(`Starting release branch ${releaseBranch}`);

  const branchCmd = `git branch ${releaseBranch} ${head}`;
  run(branchCmd);

  // Check out release branch
  logger.info(`Checking out release branch ${releaseBranch}`);
  const checkoutCmd = `git checkout ${releaseBranch}`;
  logger.debug(checkoutCmd);
  execSync(checkoutCmd);

  // Bump version (no commit)
  const bumpCmd = `npm version --no-git-tag-version ${args.semverlevel}`;
  logger.info("Bumping version number");
  logger.debug(bumpCmd);
  execSync(bumpCmd, { cwd: packages["web-features"], stdio: "inherit" });
  const { version } = JSON.parse(
    readFileSync(join(packages["web-features"], "package.json"), {
      encoding: "utf-8",
    })
  );
  logger.debug(
    readFileSync(join(packages["web-features"], "package.json"), {
      encoding: "utf-8",
    })
  );

  // Commit
  logger.info("Committing version bump");
  const commitMessage = `Increment ${args.semverlevel} version to v${version}`;
  const commitCmd = `git commit --all --message="${commitMessage}"`;
  run(commitCmd);

  // Push release branch
  logger.info("Pushing release branch");
  const pushCmd = `git push --set-upstream origin ${releaseBranch}`;
  run(pushCmd);

  // TODO: generate pretty diff

  // Create PR
  logger.info(`Creating PR for ${version}`);
  const title = `📦 Release web-features@${version}`;
  const reviewer = "ddbeck";
  const bodyFile = fileURLToPath(
    new URL("release-pull-description.md", import.meta.url)
  );

  // TODO: Append pretty diff to description
  const diffTemplate = ["```diff", "", "```"];

  const pullRequestCmd = [
    "gh pr create",
    `--title="${title}"`,
    `--reviewer="${reviewer}"`,
    `--body-file=${bodyFile}`,
    `--repo="ddbeck/feature-set"`, // TODO: remove after testing
    `--base="main"`,
    `--head="${releaseBranch}"`,
  ].join(" ");
  run(pullRequestCmd);
}

function update(args) {
  // TODO: Rebase
  // TODO: Run `npm run build`
  // TODO: Commit results of `npm run build`
  throw Error("Not implemented");
}

function publish(args) {
  // TODO: Run `npm publish …`
  throw Error("Not implemented");
}
