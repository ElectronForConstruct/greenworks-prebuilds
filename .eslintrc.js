const path = require('path');

module.exports = {
    extends: [
        'airbnb-base',
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        // 'prettier/@typescript-eslint',
        // 'plugin:prettier/recommended',
    ],
    plugins: ['import'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: path.resolve(__dirname, './tsconfig.json'),
        tsconfigRootDir: __dirname,
    },
    env: {
        node: true,
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        'no-console': 'off',
        'semi': ['error', 'never'],
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                mjs: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
        '@typescript-eslint/ban-ts-ignore': 0
    },
};
