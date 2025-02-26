#!/bin/sh

set -e

GITHUB_BRANCH=${GITHUB_REF##*/}

# Don't run for greenkeeper branches; there are too many!
if [[ $GITHUB_BRANCH =~ ^greenkeeper/ ]]; then
  exit 0
fi

# A version of the branch name that can be used as a DNS name once we prepend and append some stuff.
SAFE_BRANCH_NAME=$(printf '%s' "${GITHUB_BRANCH:0:32}" | sed -e 's/./\L&/g' -e 's/[^-a-z0-9]/-/g' -e 's/-*$//')

[[ $SAFE_BRANCH_NAME != $GITHUB_BRANCH ]] && echo "::warning file=buildprocess/ci-deploy.sh::Branch name sanitised to '${SAFE_BRANCH_NAME}' for kubernetes resources. This may work, however using branch names less than 32 characters long with [a-z0-9] and hyphen separators are preferred"

gh api /repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA} -f state=pending -f context=deployment -f target_url=${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}

# Install some tools we need from npm
npm install -g https://github.com/terriajs/sync-dependencies
npm install -g yarn@^1.19.0
yarn add -W request@2.83.0

# Clone and build TerriaMap, using this version of TerriaJS
TERRIAJS_COMMIT_HASH=$(git rev-parse HEAD)
git clone -b react-18-upgrade https://github.com/TerriaJS/TerriaMap.git
cd TerriaMap
TERRIAMAP_COMMIT_HASH=$(git rev-parse HEAD)
sed -i -e 's@"terriajs": ".*"@"terriajs": "'$GITHUB_REPOSITORY'#'${GITHUB_BRANCH}'"@g' package.json
sync-dependencies --source terriajs
git config --global user.email "info@terria.io"
git config --global user.name "GitHub Actions"
git commit -a -m 'temporary commit' # so the version doesn't indicate local modifications
git tag -a "TerriaMap-$TERRIAMAP_COMMIT_HASH--TerriaJS-$TERRIAJS_COMMIT_HASH" -m 'temporary tag'
rm yarn.lock # because TerriaMap's yarn.lock won't reflect terriajs dependencies
yarn install
yarn add -W moment@2.24.0
yarn gulp build --baseHref="/${SAFE_BRANCH_NAME}/"

pwd

yarn "--terriajs-map:docker_name=terriajs-ci" docker-build-ci --tag "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
gcloud auth configure-docker asia.gcr.io --quiet
docker push "asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME"
helm upgrade --install --recreate-pods -f ../buildprocess/ci-values.yml --set global.exposeNodePorts=true --set "terriamap.image.full=asia.gcr.io/terriajs-automated-deployment/terria-ci:$SAFE_BRANCH_NAME" --set "terriamap.serverConfig.shareUrlPrefixes.s.accessKeyId=$SHARE_S3_ACCESS_KEY_ID" --set "terriamap.serverConfig.shareUrlPrefixes.s.secretAccessKey=$SHARE_S3_SECRET_ACCESS_KEY" --set "terriamap.serverConfig.feedback.accessToken=$FEEDBACK_GITHUB_TOKEN" "terriajs-$SAFE_BRANCH_NAME" deploy/helm/terria

cd ..
node buildprocess/ci-cleanup.js

gh api /repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA} -f state=success -f context=deployment -f target_url=http://ci.terria.io/${SAFE_BRANCH_NAME}/
