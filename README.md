# diff-modules

Compares node_module versions between two node_modules directories

## Usage

```sh
$ npx diff-modules /path/to/base/node_modules /path/to/comparison/node_modules
```

## Options

diff-modules allows to filter the output and only display certain mutations through the options `--diff-only` and `--changed-only`

### diff-only

This option will only show the packages that are actually different between base and comparison. Packages with the same versions between both will be hidden.

```sh
npx diff-modules --diff-only /path/to/base/node_modules /path/to/comparison/node_modules
```

### changed-only

This option will only show the packages that are used in both base and comparison, but with different versions.

```sh
npx diff-modules --changed-only /path/to/base/node_modules /path/to/comparison/node_modules
```
