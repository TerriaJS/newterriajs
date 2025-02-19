First, read [Cloning and Building](../customizing/cloning-and-building.md).

## Building a TerriaMap against a modified TerriaJS

What if you need to make changes to [TerriaJS](https://github.com/TerriaJS/terriajs) while working on a site that depends on it?

In the process described in [Cloning and Building](../customizing/cloning-and-building.md), the [TerriaJS package](https://www.npmjs.com/package/terriajs) is installed to the `node_modules` directory by `yarn install`. Please do not edit TerriaJS directly in the `node_modules` directory, because changes will be clobbered the next time you run `yarn install`.

Instead, we want to clone TerriaJS from its [GitHub repo](https://github.com/TerriaJS/terriajs) and use that in our TerriaMap build. Traditionally, `npm link` is the way to do this. However, we do not recommend use of `npm link` because it frequently leads to multiple copies of some libraries being installed, which in turn leads to all sorts of frustrating build problems. Instead, we recommend [yarn](https://yarnpkg.com) and its [workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) feature. `yarn` workspaces let us safely clone a git repo into the `packages` directory and wire it into any other packages that use it.

First, install `yarn` globally:

```
npm install -g yarn
```

If you already have yarn installed, make sure it is at least v1.0 (we recommend using the latest version). Older versions do not support the workspace feature.

Then, enable workspaces by editing the TerriaMap `package.json` file, adding these lines to the top, just after the opening `{`:

```json
  "private": true,
  "workspaces": {
    "packages": ["packages/*"],
    "nohoist": ["**/husky"]
  },
```

Do _not_ commit this change.

Now, you can clone any package (such as `terriajs` or `terriajs-cesium`) into the `packages` directory:

```
mkdir packages
cd packages
git clone https://github.com/TerriaJS/terriajs.git
cd ..
```

This will give you the `main` branch of TerriaJS. While we strive to keep `main` stable and usable at all times, you must be aware that `main` is less tested than actual releases, and it may not be commpatible with the `main` branch of TerriaMap. So, you may want to check out the actual version of TerriaJS that you're using before you start making changes. To do that:

```
grep terriajs package.json
# will print something like: "terriajs": "^4.5.0"
cd packages/terriajs
git checkout 4.5.0
cd ..
```

!!! note

    The version of TerriaJS in your `packages/terriajs` directory must be semver-compatible with the version specification in TerriaMap's `package.json`. If it's not, yarn will install a separate semver-compatible version of TerriaJS in `node_modules` instead of using the one you've put in `packages/terriajs`. The version numbers are _usually_ already aligned, but if not, change the `"terriajs": "x.y.z"` dependency in TerriaMap's `package.json` to be the exact `"version"` property in TerriaJS's `package.json`. You will generally not want to commit this change.

Then, in the TerriaMap directory, run:

```
yarn install
```

Yarn will:

- Install all dependencies for both TerriaMap and any packages in your `packages` directory.
- Install the `devDependencies` for packages in the `packages` directory so you can actually develop on them.
- Create sym-links so that everything works.
- De-duplicate semver-compatible packages and bubble them up to the root `node_modules` directory.

Now, we can edit TerriaJS in `packages/terriajs` with the benefit of a full-featured git repo.

Confirm that yarn has configured TerriaMap to use the copy of TerriaJS in `packages/terriajs` by verifying that `node_modules/terriajs` is a symlink to `packages/terriajs`. If it's not, you probably have a version conflict. See the note above.

!!! note

    Running `yarn install` with workspaces configured will change `yarn.lock`.  Please do not commit the changes.

To switch TerriaMap back to using the npm version of TerriaJS (instead of the git repo), do:

```
# warning: make sure you don't need any of your changes to TerriaJS first!
rm -rf packages/terriajs
yarn install
```

## Committing modifications

If you make changes to TerriaJS and TerriaMap together, here's the process for getting them to production.

First, commit your TerriaJS changes to a branch and open a pull request to merge that branch to main. Simultaneously, you may want to make a branch of TerriaMap that uses your modified version of TerriaJS. To do that, modify TerriaMap's `package.json`. Where it has a line like:

```
"terriajs": "^4.5.0",
```

Change it to:

```
"terriajs": "git://github.com/TerriaJS/terriajs.git#branchName",
```

Replace `branchName` with the name of the TerriaJS branch you want to use. You may even use a repository other than `TerriaJS/terriajs` if your branch is in a fork of TerriaJS instead of in the official repository.

Once your TerriaJS pull request has been merged and a new version of the `terriajs` npm module has been published, please remember to update `package.json` to point to an official `terriajs` version instead of a branch in a GitHub repo.

The `package.json` in the `main` branch of TerriaMap should point to official releases of `terriajs` on npm, NOT GitHub branches. In other words, it is ok to commit a package.json with a git URL to a branch, but do _not_ merge it to main.

## Documentation

You need a standalone install of MkDocs and the `mkdocs-material` theme in order to build the user guide. Install these by running:

```
pip install -r requirements.txt
```

Documentation is automatically generated from the source via JSDoc (reference) and MkDocs (user guide) by running:

```
yarn gulp docs
```

It will be placed in the `wwwroot/doc` folder.

## Tests / Specs

We use [Jasmine](https://jasmine.github.io/) for the TerriaJS tests, called specs in Jasmine parlance. To run the specs, you first need to build them by running this in the TerriaJS (not TerriaMap!) directory:

```
yarn gulp
```

And start the development web server by running (also from the TerriaJS and not TerriaMap! directory):

```
yarn start
```

The test suite is run by opening a web browser on [http://localhost:3002/SpecRunner.html](http://localhost:3002/SpecRunner.html). The source code for the specs is found in the `test/` directory.

## TerriaJS Gulp Tasks

Run any of these tasks with `yarn gulp <task name>` from within the TerriaJS directory:

- default - Invoked by running gulp without any arguments, this task invokes the `build` and `lint` tasks.
- `build` - Builds a non-minified version of the TerriaJS tests. This task may take 10 seconds or more, which is the main reason for the next task.
- `watch` - Starts the same as `build` but then it stays running and watches for changes to any TerriaJS or Cesium source file that was pulled in to the build. When a change to any of these files is detected, a fast incremental build is automatically kicked off. The incremental build is much faster than the full rebuild because dependencies between source files are cached.
- `release` - The same as `build` except that it also minifies the build tests.
- `lint` - Runs ESLint on the files in the `lib` folder and reports any problems. The ESLint rules are defined in the `.eslintrc.js` file in the root directory of TerriaJS.
- `docs` - Generates the user guide and reference documentation. The user guide is served at `http://localhost:3002/doc/guide/` and the reference documentation is at `http://localhost:3002/doc/reference/`.
- `make-schema` - Generates [JSON Schema](http://json-schema.org/) for the TerriaJS [Initialization Files](../customizing/initialization-files.md) from the source code. The schema is written to `wwwroot/schema`.
- `test` - Detects browsers available on the local system and launches the test suite in each. The results are reported on the command line.

See `gulpfile.js` for more gulp tasks.

## TerriaMap Gulp Tasks

Run any of these tasks with `yarn gulp <task name>` from within the TerriaMap directory:

- default - Invoked by running gulp without any arguments, this task invokes the `build` and `lint` tasks.
- `build` - Builds a non-minified version of TerriaMap, TerriaJS, Cesium, and all other dependencies, together in one JS file (called `wwwroot/build/TerriaMap.js`). Only the parts of TerriaJS and Cesium that we use (directly or indirectly) are pulled in. Web Workers, CSS, and other resources are also built by this task. This task may take 10 seconds or more, which is the main reason for the next task.
- `watch` - Starts the same as `build` but then it stays running and watches for changes to any TerriaMap, TerriaJS, or Cesium resource. When a change to any of these files is detected, a fast incremental build is automatically kicked off. The incremental build is much faster than the full rebuild because dependencies between source files are cached.
- `release` - The same as `build` except that it also minifies the built JavaScript files. This task should be used when building for production.
- `lint` - Runs ESLint on `index.js` and the files in the `lib` folder and reports any problems. The ESLint rules are defined in the `.eslintrc` file in the root directory of TerriaMap.
- `make-package` - Creates a `.tar.gz` package in `deploy/packages` from the current build. This package can be copied to another machine to run the application there. The arguments are:

| Argument                        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--packageName <name>`          | The name of the package. If not specified, the name is `<npm_package_name>-<git_describe>`, where `<npm_package_name>` is the value of the `npm_package_name` environment variable and `<git_describe>` is the output of running `git describe`. If you invoke this task using `yarn gulp make-package` instead of simply `gulp make-package`, the `npm_package_name` environment variable will be automatically set to the name of the project in `package.json`. |
| `--serverConfigOverride <file>` | The path to a file with overrides of the `devserverconfig.json` file. If not specified, `devserverconfig.json` is used unmodified.                                                                                                                                                                                                                                                                                                                                 |
| `--clientConfigOverride <file>` | The path to a file with overrides of the `wwwroot/config.json` file. If not specified, `wwwroot/config.json` is used unmodified.                                                                                                                                                                                                                                                                                                                                   |

- `clean` - Removes the `wwwroot/build` directory.
- `sync-terriajs-dependencies` - For all npm packages used by both TerriaMap and TerriaJS, updates TerriaMap's `package.json` to use the same version as TerriaJS. This avoids build problems (errors, hangs) caused by package version conflicts.
