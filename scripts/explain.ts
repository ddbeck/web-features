import { setLogger } from "compute-baseline";
import winston from "winston";
import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .scriptName("dist")
  .usage("$0 [filenames..]", "Explain why dist.yml has the status it does.", (yargs) =>
    yargs.positional("filenames", {
      describe: "YAML files to explain",
    }),
  )
  .demandOption("filenames")
  .option("verbose", {
    alias: "v",
    describe: "Show more information about calculating the status",
    type: "count",
    default: 0,
    defaultDescription: "warn",
  }).argv;

const logger = winston.createLogger({
  level: argv.verbose > 0 ? "debug" : "warn",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
  transports: new winston.transports.Console(),
});

setLogger(logger);

function main() {
  for (const file of argv.filenames) {
    // TODO: fill in
    // TODO: get top-level status
    // TODO: get status of each compat key
    // TODO: determine keystone release(s) (i.e., the version that contributed the `baseline_low_date`)
    // TODO: determine keystone feature(s) (i.e., the compat key(s) that contributed the `baseline_low_date`)
    // TODO: list compat keys, grouped by equivalent `support` `Map`s and sorted by `baseline_low_date`
  }
}