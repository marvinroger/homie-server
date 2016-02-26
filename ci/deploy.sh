#!/usr/bin/env bash

echo "== Deploy script =="

if [ "$TRAVIS_NODE_VERSION" != "stable" ]
then
  echo "Job is not using stable node, exiting..."
  exit 0
fi

if [ "$TRAVIS_PULL_REQUEST" != "false" ]
then
  echo "Pull request, exiting..."
  exit 0
fi

# See https://github.com/travis-ci/travis-ci/issues/4745
#if [ "$TRAVIS_BRANCH" != "master" ]
#then
#  echo "Branch is not master, exiting..."
#  exit 0
#fi

if [ -z "$TRAVIS_TAG" ]
then
  echo "Build is not tagged, exiting..."
  exit 0
fi

# workaround for the above issue
if [[ ! "$TRAVIS_TAG" =~ ^v[0-9]+.[0-9]+.[0-9]+$ ]]
then
  echo "Build tag is not a version one, exiting..."
  exit 0
fi

echo "Adding .npmrc"
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > dist/.npmrc

echo "Publishing to npm"
cd dist/ || exit
npm publish

if [ ! $? -eq 0 ]
then
  echo "npm publishing failed, exiting..."
  exit 1
fi

echo "Triggering Appveyor build"
HTTP_CODE=$(curl -s -o /dev/null -i -w "%{http_code}" -H "Content-type: application/json" -H "Authorization: Bearer $APPVEYOR_TOKEN" -X POST -d "{ accountName: \"marvinroger\", projectSlug: \"homie-server\", branch: \"master\", commitId: \"$TRAVIS_COMMIT\" }" https://ci.appveyor.com/api/builds)

if [ ! $? -eq 0  ] || [ ! "$HTTP_CODE" -eq 200 ]
then
  echo "npm publishing failed, exiting..."
  exit 1
fi
