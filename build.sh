cd core &&       \
yarn test &&     \
yarn compile &&  \
cd .. &&         \
cd samples &&    \
yarn test -- --watchAll=false