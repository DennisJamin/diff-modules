#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';

program
  .argument('<base>', 'Base node_modules directory')
  .argument('<comparison>', 'Comparison node_modules directory')
  .option(
    '--diff-only',
    'Only show package differences, omitting unchanged packages',
  )
  .option(
    '--changed-only',
    'Only show packages that exist in both base and comparison',
  );

program.parse();

const options = program.opts();
const [baseDirectory, comparisonDirectory] = program.args;

interface Packages {
  [key: string]: string;
}

const comparePackages = () => {
  console.info(
    `Comparing "${baseDirectory}" against "${comparisonDirectory}" \n`,
  );

  const basePackages = getPackagesFromDirectory(baseDirectory);
  const comparisonPackages = getPackagesFromDirectory(comparisonDirectory);

  if (!basePackages || !comparisonPackages) {
    console.info(
      'Could not compare, base or comparison do not have any packages',
    );
    return;
  }

  Object.keys(basePackages).forEach(basePackage => {
    const baseVersion = basePackages[basePackage];
    const comparisonVersion = comparisonPackages[basePackage];

    if (basePackage in comparisonPackages) {
      if (baseVersion === comparisonVersion) {
        !options.diffOnly &&
          console.info(`  "${basePackage}": "${baseVersion}"`);
      } else {
        console.info(chalk.red(`- "${basePackage}": "${baseVersion}"`));
        console.info(chalk.green(`+ "${basePackage}": "${comparisonVersion}"`));
      }
    } else {
      !options.changedOnly &&
        console.info(chalk.red(`- "${basePackage}": "${baseVersion}"`));
    }
  });
};

const getPackagesFromDirectory = (
  directory: string,
  namespace = '',
): Packages | undefined => {
  let packages: Packages = {};

  if (!fs.existsSync(directory)) {
    console.error(
      chalk.red.bold(`Could not list "${directory}" as it does not exist`),
    );
    return;
  }

  fs.readdirSync(directory)
    .filter(name => !/^\./.test(name))
    .map(name => {
      if (name[0] === '@') {
        packages = Object.assign(
          {},
          packages,
          getPackagesFromDirectory(path.join(directory, name), name),
        );
      } else {
        const packageJson = path.join(directory, name, 'package.json');

        if (!fs.existsSync(packageJson)) return;

        const packageJsonContents = fs.readFileSync(packageJson, 'utf-8');

        try {
          const { version } = JSON.parse(packageJsonContents);
          packages[`${namespace}/${name}`.replace(/^\//, '')] = version;
        } catch (e) {
          console.error(chalk.red.bold(`Could not parse "${packageJson}"`));
          return;
        }
      }
    });

  return packages;
};

comparePackages();
