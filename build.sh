echo "Node version : "
node -v

npm install &&     \
npm run bomlint &&     \
cd core &&          \
./build.sh &&       \
cd ../tea-cup &&    \
./build.sh &&       \
cd ../samples &&    \
npm run test -- --watchAll=false && \
npm run build
