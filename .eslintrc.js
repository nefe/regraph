module.exports = {
  plugins: ['@typescript-eslint/tslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/tslint/config': ['warn'],
    'no-restricted-globals': 0,
    'no-undef': 0,
    'no-template-curly-in-string': 0,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
