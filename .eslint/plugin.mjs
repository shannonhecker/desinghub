/**
 * Local ESLint plugin — house rules for Design Hub.
 *
 * Flat-config consumers import this and register it under the `design-hub`
 * namespace:
 *
 *   import localPlugin from './.eslint/plugin.mjs';
 *   export default [
 *     { plugins: { 'design-hub': localPlugin } },
 *     { rules: { 'design-hub/no-hardcoded-tokens': 'warn' } },
 *   ];
 */

import noHardcodedTokens from './rules/no-hardcoded-tokens.mjs';

const plugin = {
  meta: { name: 'design-hub', version: '0.1.0' },
  rules: {
    'no-hardcoded-tokens': noHardcodedTokens,
  },
};

export default plugin;
