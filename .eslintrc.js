/* eslint-disable */
/* eslint-env node */

module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": './configs/recommended.cjs',
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        },
        {
            "env": {
                "jest": true,
                "node": true
            },
            "files": [
                "**/__tests__/**/*.ts",
                "**/*.test.ts"
            ],
            "rules": {
                "new-cap": "off",
                "dot-notation": "off"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
    }
}
