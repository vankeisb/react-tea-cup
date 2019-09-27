Please use PRs on the develop branch.

To release :
* create a release branch
* bump version in package.json
* build everything
    * ./build.sh
    * cd samples
    * npm install
    * npm start
* don't forget to commit package-lock
* merge fb and create tag

> this is better done using git flow

Travis should deploy to npm on tag builds.
