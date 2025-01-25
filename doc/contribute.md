Please use PRs on the develop branch.

# Dev env

This is a "mono-repo". We use `yarn` to manage the inter-module dependencies.

Have a look at `build.sh` for more info..

# Releasing

We follow `git-flow`, so to release :

    git flow release start a.b.c
    // bump version(s), commit, make sure it's ok
    git flow release finish a.b.c
    // push develop, master, and tag

The package is deployed to npm on tag builds.
