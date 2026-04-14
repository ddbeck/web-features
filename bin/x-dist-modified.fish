#!/usr/bin/env fish

set modified (git diff --cached --name-only; and git diff --name-only; and git ls-files --others --exclude-standard)
set features (string match 'features/*.yml' $modified)

npm run dist -- $features
