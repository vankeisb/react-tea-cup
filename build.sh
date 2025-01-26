echo "Node version : "
node -v

npm install &&     \
npm run bomlint &&     \
cd ./tea-cup &&    \
./build.sh &&       \
cd ../samples &&    \
npm run test && \
npm run build
