yarn install &&     \
yarn bomlint &&     \
cd core &&          \
./build.sh &&       \
cd ../tea-cup &&    \
./build.sh &&       \
cd ../samples &&    \
yarn test --watchAll=false && \
yarn build
