#!/usr/bin/env bash

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
cd dist/
npm publish
curl -H "Content-type: application/json" -H "Authorization: Bearer $APPVEYOR_TOKEN" -X POST -d "{ accountName: \"marvinroger\", projectSlug: \"homie-server\", branch: \"master\", commitId: \"$TRAVIS_COMMIT\" }" https://ci.appveyor.com/api/builds
