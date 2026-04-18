// @ts-check

const js = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');

module.exports = defineConfig(js.configs.recommended, tseslint.configs.strict);
