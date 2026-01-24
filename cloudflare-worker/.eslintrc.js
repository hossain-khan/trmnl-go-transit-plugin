module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console for logging in Workers
    'semi': ['error', 'never'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'only-multiline'],
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'no-trailing-spaces': 'error',
    'eol-last': ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',
  },
}
