module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import', 'babel'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],

  rules: {
    'babel/object-curly-spacing': 'off',
    'no-console': 'off',
    'babel/semi': 'off',
    'comma-dangle': 'off',
    'array-bracket-spacing': 'off',
    semi: [2, 'never'],
    '@typescript-eslint/semi': ['off'],
    'no-unsafe-member-access': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    'import/order': [
      'error',
      {
        'newlines-between': 'ignore',
      },
    ],
    'no-use-before-define': 'off',
    'prefer-spread': 'off',
    'keyword-spacing': 'off',
    curly: ['error', 'multi', 'consistent'],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'no-empty-function': 'off',
    'no-loop-func': 'off',
    'require-await': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'require-atomic-updates': 'off',
    'babel/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
      },
    ],
  },
  ignorePatterns: ['.eslintrc.js'],
  settings: {
    'import/resolver': {
        "typescript": {},
      node: {
        extensions: ['.ts'],
      },
    },
  },
  env: {
    browser: true,
    node: true,
    jest: true,
  },
}
