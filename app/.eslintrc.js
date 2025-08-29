module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  plugins: ['jest'],
  env: {
    'jest/globals': true,
  },
  rules: {
    'react-hooks/exhaustive-deps': 'off',
    'react/no-unstable-nested-components': 'off',
    'no-unused-vars': 'off',
    curly: 'off',
  },
};
