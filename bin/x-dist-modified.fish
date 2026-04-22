#!/usr/bin/env fish

set modified (git diff --cached --name-only; and git diff --name-only; and git ls-files --others --exclude-standard)
set features (string match 'features/*.yml' $modified)
set exists

for file in $features
    if test -e $file
        set --append exists $file
    end
end

npm run dist -- $exists
