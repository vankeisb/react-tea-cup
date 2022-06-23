This project includes various samples for `react-tea-cup`.

These samples were implemented to validate the approach and
test everything. They are not meant to be "good practises".

# Build / Run

    # make sure tea-cup is compiled
    cd react-tea-cup
    yarn install
    cd core
    yarn run compile
    cd ../tea-cup
    yarn run compile

    # run the samples 
        # With React 16 (default)
        cd ../samples
        yarn start
    
        # With React 17
        cd ../samples
        yarn upgrade react@^17.0.1 react-dom@^17.0.1 @types/react@^17.0.1 @types/react-dom@^17.0.1
        yarn start

The samples app is made with `create-react-app`. See the scripts in `package.json`.
