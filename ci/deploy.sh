#!/usr/bin/env sh

echo "Deploy script"

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

if [ "$TRAVIS_BRANCH" != "master" ]
then
  echo "Branch is not master, exiting..."
  exit 0
fi

echo "$TRAVIS_PULL_REQUEST"
echo "$TRAVIS_BRANCH"
echo "$NPM_TOKEN"
echo "$APPVEYOR_TOKEN"
echo "$TRAVIS_COMMIT"
echo "$TRAVIS_NODE_VERSION"
echo "$TRAVIS_TAG"

if [ ! -v TRAVIS_TAG ]
then
  echo "Build is not tagged, exiting..."
  exit 0
fi

#echo "Adding .npmrc"
#echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
#echo "Publishing to npm"
#cd dist/
#npm publish
#echo "Triggering Appveyor build"
#curl -H "Content-type: application/json" -H "Authorization: Bearer $APPVEYOR_TOKEN" -X POST -d "{ accountName: \"marvinroger\", projectSlug: \"homie-server\", branch: \"master\", commitId: \"$TRAVIS_COMMIT\" }" https://ci.appveyor.com/api/builds
