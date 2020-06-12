module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // "@vue/airbnb"
    'airbnb-base',
  ],

  rules: {
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'state',
          'acc',
          'e',
          'ctx',
          'req',
          'request',
          'res',
          'response',
          '$scope',
        ],
      },
    ],
    'no-shadow': ['error', { allow: ['state'] }],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'object-curly-newline': 'off',

  },
  root: true,
  env: {
    node: true,
  },

  parserOptions: {
    parser: 'babel-eslint',
  },
};
