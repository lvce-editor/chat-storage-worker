import { defineConfig } from 'eslint/config'
import * as config from '@lvce-editor/eslint-config'
import * as tsconfig from '@lvce-editor/eslint-plugin-tsconfig'
import * as regex from '@lvce-editor/eslint-plugin-regex'

export default defineConfig([
  ...config.default,
  ...config.recommendedActions,
  ...tsconfig.default,
  ...regex.default,
  {
    rules: {
      'sonarjs/cognitive-complexity': 'off',
      'unicorn/empty-brace-spaces': 'off',
    },
  },
  {
    files: ['packages/chat-storage-worker/{src,test}/**/*.ts'],
    rules: {
      'jest/no-disabled-tests': 'off',
      'no-restricted-syntax': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/no-global-object-property-assignment': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/prefer-else-if': 'off',
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-iterator-to-array': 'off',
    },
  },
])
