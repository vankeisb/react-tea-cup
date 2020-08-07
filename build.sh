yarn install &&     \
cd core &&          \
./build.sh &&       \
cd ../tea-cup &&    \
./build.sh &&       \
cd ../samples &&    \
yarn test -- --watchAll=false