#! /usr/bin/env node
'use strict';
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');

const basePath = process.argv[2];
const comparePath = process.argv[3];

if (!basePath || !comparePath) {
  console.error(colors.red('A base and compare path must be provided'));
  return process.exit(1);
}

const base = readModules(basePath);
const compare = readModules(comparePath);

console.info(
  '\n' + colors.bold(`Diffing ${base.name} against ${compare.name}`) + '\n',
);

Object.keys(base.deps).forEach(baseKey => {
  if (baseKey in compare.deps) {
    if (base.deps[baseKey] === compare.deps[baseKey]) {
      console.info(`  "${baseKey}": "${base.deps[baseKey]}"`);
    } else {
      console.info(colors.red(`- "${baseKey}": "${base.deps[baseKey]}"`));
      console.info(colors.green(`+ "${baseKey}": "${compare.deps[baseKey]}"`));
    }
  } else {
    console.info(colors.red(`- "${baseKey}": "${base.deps[baseKey]}"`));
  }
});

function readModules(location) {
  // Resolve package dependencies
  if (location.indexOf('package.json') !== -1) {
    const data = fs.readFileSync(location.replace(':dev', ''), 'utf-8');
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      parsed = false;
    }
    if (!parsed) {
      return;
    }

    const depsKey =
      location.indexOf(':dev') !== -1 ? 'devDependencies' : 'dependencies';
    const deps = parsed[depsKey]
      ? parsed[depsKey]
      : parsed.dependencies || parsed.devDependencies;

    Object.keys(deps).forEach(key => {
      deps[key] = deps[key].replace(/\^|~/g, '');
    });
    return {
      name: `${location} {${depsKey}}`,
      deps,
    };
  }

  return {
    name: location,
    deps: getPackagesFromLocation(location),
  };
}

function getPackagesFromLocation(location, prefix = '') {
  let table = {};

  fs.readdirSync(location)
    .filter(name => name !== '.bin')
    .map(name => {
      if (name[0] === '@') {
        table = Object.assign(
          {},
          table,
          getPackagesFromLocation(path.join(location, name), name),
        );
      } else {
        const pkg = path.join(location, name, 'package.json');
        const exists = fs.existsSync(pkg);

        if (!exists) return;

        const data = fs.readFileSync(pkg, 'utf-8');

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = false;
        }

        if (!parsed) return;

        table[(prefix ? prefix + '/' : '') + name] = parsed.version;
      }
    });

  return table;
}
