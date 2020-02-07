#!/bin/bash
PATH=$PATH:$PWD/node_modules/.bin

ROOT=$(dirname $(readlink -f $0))/..
INITIAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "roo path : $ROOT"

main() {
  ensure_clean_index &&
    check_version &&
    git_detach &&
    clean &&
    run_build &&
    commit_and_tag &&
    push_and_publish
}

ensure_clean_index() {
  echo_funcname

  # ignore filemode changes
  git config core.fileMode false

  # make sure the repo is clean
  if ! git diff-index HEAD --stat --exit-code; then
    exit_code=$?
    echo
    quit "working directory must be clean" $exit_code
  fi
}

check_version() {
  echo_funcname

  NEW_VERSION=$(node ./scripts/version.js)
  NEW_TAG="v$(npx semver clean $NEW_VERSION)"

  if [[ $NEW_TAG == v ]]; then
    quit "failed parsing version from '$NEW_VERSION'" 1
  fi

  # if the version tag already exists
  if [[ $(git tag -l $NEW_TAG) == $NEW_TAG ]]; then
    quit "$NEW_TAG tag already exists" 1
  fi

  if [[ -n $NPM_TAG ]]; then
    echo "will publish to npm with '$NPM_TAG' tag"
  fi
}

git_detach() {
  echo_funcname

  # detach HEAD
  git checkout --detach || exit $?
}

clean() {
  npm run clean
}

run_build() {
  echo_funcname

  # copy README
  # cp $ROOT/README.md interactjs/ &&

  # copy license file
  # npx lerna exec --no-private -- cp -v $ROOT/LICENSE . ||
  #   quit "failed to copy LICENSE"

  # copy .npmignore to all packages
  # npx lerna exec --no-private -- "echo '# copied from [root]/.npmignore' > .npmignore
  #   cat $ROOT/.npmignore >> .npmignore" &&

  ## generate esnext .js modules
  npm run esnext &&

  # bundle interactjs, generate docs, transpile modules, generate declaration files
  npm run build || exit $?
}

commit_and_tag() {
  echo_funcname

  # commit and add new version tag
  git add --all &&
    git add --force *interactjs/**/*.{ts,js,js.map} interactjs/dist &&
    git commit -m $NEW_TAG &&
    git tag $NEW_TAG
}

push_and_publish() {
  echo_funcname

  if [[ -n $NPM_TAG ]]; then
    tag_arg="--tag $NPM_TAG"
  fi

  # push branch and tags to git origin
  git push --no-verify origin $NEW_TAG || quit "failed to push git tag $NEW_TAG to origin" $?

  # add gitHead to package.json files
  node ./scripts/setGitHead.js

  # publish to npm with release tag if provided
  npx lerna exec --no-private -- npm publish $tag_arg || quit "failed to publish to npm" $?

  git checkout $(git ls-files '**package.json')
}

echo_funcname() {
  echo -e "\n==== ${FUNCNAME[1]} ====\n"
}

quit() {
  if [ -n "$1" ]; then
    if [ -z "$2" ] || [ "$2" == 0 ]; then
      echo $1
    else
      echo $1 >&2
    fi
  fi

  exit $2
}

main
