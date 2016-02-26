#!/usr/bin/env bash

echo "Adding .npmrc"
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
echo "Publishing to npm"
cd dist/
npm publish
echo "Triggering Appveyor build"
curl -H "Content-type: application/json" -H "Authorization: Bearer $APPVEYOR_TOKEN" -X POST -d "{ accountName: \"marvinroger\", projectSlug: \"homie-server\", branch: \"master\", commitId: \"$TRAVIS_COMMIT\" }" https://ci.appveyor.com/api/builds
