#!/usr/bin/env node

import { Temporal } from "@js-temporal/polyfill";
import { Octokit } from "@octokit/rest";
import url from "node:url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const timeZone = "Etc/UTC";
const defaultOwner = "web-platform-dx";
const defaultRepo = "web-features";
const coverageGapStatisticsIssue = 4402;

const argv = yargs(hideBin(process.argv))
  .usage("$0", `Generate a "what's new" outline in Markdown format`)
  .example("$0", `Generate a "What's new in web-features" outline`)
  .example(
    "$0 --gh-token=$(gh auth token)",
    "Generate an outline without hitting GitHub rate limits",
  )
  .example("$0 -R mdn/browser-compat-data", "Generate an outline for BCD")
  .example(
    "$0 -R mdn/browser-compat-data --search='-label:dependencies'",
    "Generate an outline for BCD without the dependencies label",
  )
  .example(
    "$0 --gh-token=$(gh auth token) --search='involves:@me'",
    "Generate an outline for PRs involving the user running the script (requires token)",
  )
  .option("repo", {
    alias: "R",
    type: "string",
    nargs: 1,
    description: "The repo to query in owner/repo format",
    default: `${defaultOwner}/${defaultRepo}`,
  })
  .option("from", {
    type: "string",
    description: "A start date or timestamp (presumed to be UTC)",
    defaultDescription: "The first second of the day one week ago",
  })
  .option("to", {
    type: "string",
    description: "An end date or timestamp (presumed to be UTC)",
    defaultDescription: "The last second of the previous day (UTC)",
  })
  .option("search", {
    type: "string",
    description:
      "Extra GitHub search qualifiers. For example, to exclude a label.",
    default: "-label:generated",
  })
  .option("gh-token", {
    describe: "GitHub authentication token (e.g., from `gh auth token`)",
    nargs: 1,
  })
  .parseSync();

class GitHub {
  octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      timeZone,
      auth: token,
    });
  }

  getReleases(owner, repo) {
    return this.octokit.paginate(this.octokit.rest.repos.listReleases, {
      owner,
      repo,
    });
  }

  getComments(owner: string, repo: string, issue_number: number) {
    return this.octokit.rest.issues.listComments({ owner, repo, issue_number });
  }

  search(q: string) {
    return this.octokit.paginate(this.octokit.search.issuesAndPullRequests, {
      q,
    });
  }
}

if (import.meta.url.startsWith("file:")) {
  if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
    main();
  }
}

async function main() {
  const [owner, repo]: string[] = argv.repo.split("/");
  const fromDateTime =
    typeof argv.from === "string"
      ? Temporal.Instant.from(argv.from).toZonedDateTimeISO(timeZone)
      : Temporal.Now.zonedDateTimeISO(timeZone).subtract({ weeks: 1 }).with({
          hour: 4,
          minute: 0,
          second: 0,
        });
  const toDateTime =
    typeof argv.to === "string"
      ? Temporal.Instant.from(argv.to).toZonedDateTimeISO(timeZone)
      : Temporal.Now.zonedDateTimeISO(timeZone).with({
          hour: 4,
          minute: 0,
          second: 1,
        });
  const gh = new GitHub(
    typeof argv.ghToken === "string" ? argv.ghToken : undefined,
  );
  const releases = (await gh.getReleases(owner, repo))
    .filter((release) => {
      if (release.tag_name === "next") {
        return false;
      }
      const publishedAt = Temporal.Instant.from(
        release.published_at,
      ).toZonedDateTimeISO(timeZone);
      if (
        Temporal.ZonedDateTime.compare(fromDateTime, publishedAt) <= 0 && // On or after fromDate time
        Temporal.ZonedDateTime.compare(publishedAt, toDateTime) <= 0 // At or before toDateTime
      ) {
        return true;
      }
      return false;
    })
    .toReversed();
  const releasesMarkdown = releases
    .map((r) => `[${r.name}](${r.html_url})`)
    .join(", ");

  console.log(
    `- What's new in ${repo} from ${fromDateTime.toLocaleString("en-CA", { dateStyle: "short" })} to ${toDateTime.toLocaleString("en-CA", { dateStyle: "short" })}`,
  );
  console.log(`  - Releases: ${releasesMarkdown}`);
  console.log(`  - Highlights:`);

  const makeQuery = (fmtDate: (s: Temporal.ZonedDateTime) => string) =>
    `repo:${owner}/${repo} is:pr merged:${fmtDate(fromDateTime)}..${fmtDate(toDateTime)} ${argv.search}`;
  const pulls = await gh.search(makeQuery(formatDateForApi));

  const pullsByMergedDate = pulls.toSorted((a, b) => {
    return Temporal.Instant.compare(
      Temporal.Instant.from(a.closed_at),
      Temporal.Instant.from(b.closed_at),
    );
  });

  for (const p of pullsByMergedDate) {
    console.log(
      `    - ${p.title} ([#${p.number}](${p.html_url})) by @${p.user.login}`,
    );
  }

  console.log(
    `  * [Merged this week](https://github.com/pulls?q=${encodeURIComponent(makeQuery(formatDateForWeb))})`,
  );
  if (defaultOwner === owner && defaultRepo === repo) {
    const comments = await gh.getComments(
      owner,
      repo,
      coverageGapStatisticsIssue,
    );
    const lastComment = comments.data.at(-1);
    console.log(`  * [Coverage gap statistics](${lastComment.html_url})`);
  }
}

function formatDateForApi(dt: Temporal.ZonedDateTime): string {
  return dt.toString({
    timeZoneName: "never",
    fractionalSecondDigits: 0,
    offset: "never", // GitHub's search API doesn't seem to like the time zone offset
  });
}

function formatDateForWeb(dt: Temporal.ZonedDateTime): string {
  return dt.toString({
    timeZoneName: "never",
    fractionalSecondDigits: 0,
  });
}
