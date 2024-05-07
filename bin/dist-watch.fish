#!/usr/bin/env fish

fswatch (string match -v '*.dist.yml' -- ./features/*.yml) |
    while read -l yaml_file
        npm run dist -- $yaml_file
    end
