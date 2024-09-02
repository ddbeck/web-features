#!/usr/bin/env fish

# TODO: figure out how to use `gh`'s go templates instead of TSV with `column`

gh pr list --limit=100 --json author,title,url --jq '
  group_by(.author.login)
  | sort_by(.[].length)
  | reverse
  | .[]
  | [. | length] + ["@" + .[0].author.login] + ["https://github.com/web-platform-dx/web-features/pulls/" + .[0].author.login]
  |@tsv' | column -t -s=\t
