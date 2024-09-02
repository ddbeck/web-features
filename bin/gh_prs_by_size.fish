#!/usr/bin/env fish

# TODO: figure out how to use `gh`'s go templates instead of TSV with `column`

gh pr list --limit=100 --json additions,deletions,author,title,url,isDraft,labels --jq '
  map(. + { size: (.additions + .deletions) }) |
  sort_by(.size) |
  reverse |
  .[] |
  [.size, ("@" + .author.login), .title, (if .isDraft then "DRAFT " else " " end), .url]
  | @tsv' | column -t -s=\t
