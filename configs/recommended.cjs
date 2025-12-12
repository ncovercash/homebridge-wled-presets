/* eslint-disable */
/* eslint-env node */

module.exports = {
    env: {
        es6: true
    },
    parserOptions: {
        ecmaVersion: 2022
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        // https://github.com/typescript-eslint/typescript-eslint/issues/1824
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                ignoredNodes: ['PropertyDefinition[decorators]', 'TSUnionType', 'FunctionExpression[params]:has(Identifier[decorators])']
            }
        ],
        'no-console': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/no-shadow': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/semi': ['error'],
        'accessor-pairs': 'error',
        'array-bracket-newline': ['error', 'consistent'],
        'array-bracket-spacing': ['error', 'never'],
        'array-element-newline': ['error', 'consistent'],
        'arrow-body-style': 'error',
        'array-callback-return': 'error',
        'arrow-parens': ['error', 'as-needed'],
        'arrow-spacing': 'error',
        'block-scoped-var': 'error',
        'block-spacing': ['error', 'never'],
        'brace-style': ['error', '1tbs'],
        camelcase: ['warn'],
        'capitalized-comments': [
            'error',
            'always',
            {
                ignoreConsecutiveComments: true
            }
        ],
        'comma-dangle': ['error', 'never'],
        'comma-spacing': [
            'error',
            {
                after: true,
                before: false
            }
        ],
        'comma-style': ['error', 'last'],

        // Complexity: ['error', 7],
        'computed-property-spacing': ['error', 'never'],
        'consistent-return': 'error',
        'consistent-this': ['error', 'self'],
        'constructor-super': 'error',
        curly: 'error',
        'default-case': 'error',
        'dot-location': ['error', 'property'],
        'dot-notation': 'error',
        'eol-last': ['error', 'always'],
        eqeqeq: 'error',

        // 'filenames/match-regex': ['error', '^_?[a-z][a-zA-Z0-9-_]*$'],
        'for-direction': 'error',
        'func-name-matching': ['error', 'always'],
        'func-names': 'off',
        'func-style': 'off',
        'function-paren-newline': ['error', 'consistent'],
        'generator-star-spacing': 'error',
        'getter-return': 'error',
        'global-require': 'error',
        'guard-for-in': 'error',
        'init-declarations': 'off',
        'key-spacing': [
            'error',
            {
                afterColon: true,
                beforeColon: false
            }
        ],
        'keyword-spacing': 'error',
        'linebreak-style': ['error', 'unix'],
        'lines-around-comment': [
            'error',
            {
                allowArrayStart: true,
                allowBlockStart: true,
                allowObjectStart: true,
                beforeBlockComment: true,
                beforeLineComment: true
            }
        ],
        'lines-between-class-members': ['error', 'always'],
        'max-classes-per-file': ['error', 1],
        'max-depth': ['error', 5],
        'max-lines': ['error', 1000],
        'max-nested-callbacks': ['error', 4],
        'max-params': ['error', 5],
        'max-statements': ['error', 60],
        'max-statements-per-line': [
            'error',
            {
                max: 1
            }
        ],
        'new-cap': 'error',
        'new-parens': 'error',
        'no-alert': 'error',
        'no-array-constructor': 'error',
        'no-async-promise-executor': 'error',
        'no-bitwise': 'error',
        'no-buffer-constructor': 'error',
        'no-caller': 'error',
        'no-case-declarations': 'error',
        'no-class-assign': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': ['error', 'always'],
        'no-confusing-arrow': 'error',
        'no-const-assign': 'error',
        'no-constant-condition': 'error',
        'no-continue': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-delete-var': 'error',
        'no-div-regex': 'error',
        'no-dupe-args': 'error',
        'no-dupe-class-members': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-duplicate-imports': 'error',
        'no-else-return': 'error',
        'no-empty': 'error',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-eq-null': 'error',
        'no-eval': 'error',
        'no-ex-assign': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-extra-boolean-cast': 'error',
        'no-extra-label': 'error',
        'no-extra-parens': ['error', 'functions'],
        'no-extra-semi': 'error',
        'no-fallthrough': 'error',
        'no-floating-decimal': 'error',
        'no-func-assign': 'error',
        'no-global-assign': 'error',
        'no-implicit-coercion': 'error',
        'no-implicit-globals': 'error',
        'no-implied-eval': 'error',
        'no-inline-comments': 'off',
        'no-inner-declarations': ['off', 'both'],
        'no-invalid-regexp': 'error',
        'no-invalid-this': 'error',
        'no-irregular-whitespace': 'error',
        'no-iterator': 'error',
        'no-label-var': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-lonely-if': 'error',
        'no-loop-func': 'error',
        'no-misleading-character-class': 'error',
        'no-mixed-requires': 'error',
        'no-mixed-spaces-and-tabs': 'error',
        'no-multi-assign': 'error',
        'no-multi-spaces': 'error',
        'no-multi-str': 'error',
        'no-multiple-empty-lines': [
            'error',
            {
                max: 1,
                maxEOF: 0
            }
        ],
        'no-negated-condition': 'error',
        'no-nested-ternary': 'error',
        'no-new': 'error',
        'no-new-func': 'error',
        'no-new-object': 'error',
        'no-new-require': 'error',
        'no-new-symbol': 'error',
        'no-new-wrappers': 'error',
        'no-obj-calls': 'error',
        'no-octal': 'error',
        'no-octal-escape': 'error',
        'no-param-reassign': [
            'error',
            {
                props: false
            }
        ],
        'no-path-concat': 'error',
        'no-plusplus': 'off',
        'no-process-env': 'error',
        'no-process-exit': 'error',
        'no-proto': 'error',
        'no-redeclare': 'error',
        'no-regex-spaces': 'error',
        'no-restricted-globals': [
            'error',
            {
                name: 'event',
                message: 'Use a function parameter instead.'
            },
            {
                name: 'isFinite',
                message: 'Use Number.isFinite() instead.'
            }
        ],
        'no-restricted-syntax': ['error', 'WithStatement'],
        'no-return-assign': ['error', 'always'],
        'no-return-await': 'error',
        'no-script-url': 'error',
        'no-self-assign': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-shadow-restricted-names': 'error',
        'no-sparse-arrays': 'error',
        'no-tabs': 'error',
        'no-ternary': 'off',
        'no-this-before-super': 'error',
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-undef': 'error',
        'no-undef-init': 'error',
        'no-unexpected-multiline': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unneeded-ternary': 'error',
        'no-unreachable': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unused-expressions': 'error',
        'no-unused-labels': 'error',
        'no-use-before-define': ['error', 'nofunc'],
        'no-useless-call': 'error',
        'no-useless-catch': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-concat': 'error',
        'no-useless-constructor': 'error',
        'no-useless-escape': 'error',
        'no-useless-rename': 'error',
        'no-useless-return': 'error',
        'no-var': 'error',
        'no-void': 'error',
        'no-warning-comments': [
            'warn',
            {
                location: 'start',
                terms: ['todo', 'fixme', 'xxx', 'smell']
            }
        ],
        'no-whitespace-before-property': 'error',
        'no-with': 'error',
        'object-curly-spacing': ['error', 'never'],
        'object-property-newline': [
            'error',
            {
                allowAllPropertiesOnSameLine: true
            }
        ],
        'one-var': 'off',
        'operator-assignment': 'error',
        'operator-linebreak': ['error', 'after'],
        'padded-blocks': ['error', 'never'],
        'padding-line-between-statements': [
            'error',
            {
                blankLine: 'always',
                prev: 'directive',
                next: '*'
            },
            {
                blankLine: 'always',
                prev: 'block-like',
                next: '*'
            }
        ],
        'prefer-const': 'error',
        'prefer-numeric-literals': 'error',
        'prefer-promise-reject-errors': [
            'error',
            {
                allowEmptyReject: true
            }
        ],
        'prefer-rest-params': 'error',
        'quote-props': ['error', 'as-needed'],
        quotes: ['error', 'single'],
        radix: 'error',
        'rest-spread-spacing': ['error', 'never'],
        'require-yield': 'error',
        semi: 'error',
        'semi-spacing': [
            'error',
            {
                after: true,
                before: false
            }
        ],
        'semi-style': ['error', 'last'],
        'sort-imports': 'off',
        'sort-vars': 'off',
        'space-before-blocks': ['error', 'always'],
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'never',
                asyncArrow: 'always',
                named: 'never'
            }
        ],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': [
            'error',
            {
                nonwords: false,
                words: true
            }
        ],
        'spaced-comment': ['error', 'always'],
        strict: ['error', 'safe'],
        'switch-colon-spacing': [
            'error',
            {
                after: true,
                before: false
            }
        ],
        'symbol-description': 'error',
        'template-curly-spacing': ['error', 'never'],
        'unicode-bom': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
        'vars-on-top': 'off',
        'wrap-iife': ['error', 'outside'],
        'wrap-regex': 'error',
        'yield-star-spacing': 'error',
        yoda: 'error'
    }
};
