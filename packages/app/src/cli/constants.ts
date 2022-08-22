import {DependencyVersion} from '@shopify/cli-kit/node/node-package-manager'

export const configurationFileNames = {
  app: 'shopify.app.toml',
  extension: {
    ui: 'shopify.ui.extension.toml',
    theme: 'shopify.theme.extension.toml',
    function: 'shopify.function.extension.toml',
  },
  web: 'shopify.web.toml',
} as const

export const dotEnvFileNames = {
  production: '.env',
}

export const environmentVariables = {
  /**
   * Environment variable to instructs the CLI on running the extensions' CLI through its sources.
   */
  useExtensionsCLISources: 'SHOPIFY_USE_EXTENSIONS_CLI_SOURCES',
} as const

export const versions = {
  extensionsBinary: '3.7.1',
  react: '^17.0.0',
} as const

export const blocks = {
  extensions: {
    directoryName: 'extensions',
    configurationName: configurationFileNames.extension,
  },
  functions: {
    defaultUrl: 'https://github.com/Shopify/function-examples',
    defaultLanguage: 'wasm',
    maxCompilationStatusCheckCount: 7,
    compilationStatusWaitMs: 2000,
  },
  web: {
    directoryName: 'web',
    configurationName: configurationFileNames.web,
  },
} as const

/**
 * List of extensions for each category that are limited by quantity, only 1 of each is allowed per app
 */
export const limitedExtensions: {
  ui: UIExtensionTypes[]
  theme: ThemeExtensionTypes[]
  function: FunctionExtensionTypes[]
} = {
  ui: ['product_subscription', 'checkout_post_purchase', 'web_pixel_extension'],
  theme: ['theme'],
  function: [],
}

export const publicFunctionExtensions = {
  types: ['product_discounts', 'order_discounts', 'shipping_discounts'],
} as const
export const functionExtensions = {
  types: [
    ...publicFunctionExtensions.types,
    'shipping_rate_presenter',
    'payment_customization',
    'order_routing_ranker',
  ],
} as const

export const functionExtensionTemplates = [
  {name: 'Wasm', value: 'wasm'},
  {name: 'Rust', value: 'rust'},
]

export function isFunctionExtensionType(extensionType: string) {
  return (functionExtensions.types as ReadonlyArray<string>).includes(extensionType)
}

export const publicUIExtensions = {
  types: ['product_subscription', 'checkout_ui_extension', 'checkout_post_purchase', 'web_pixel_extension'],
} as const

export const uiExtensions = {
  types: [...publicUIExtensions.types, 'pos_ui_extension', 'customer_accounts_ui_extension'],
} as const

export const activeUIExtensions = {
  types: [...publicUIExtensions.types, 'pos_ui_extension', 'customer_accounts_ui_extension'].filter,
}

export type UIExtensionTypes = typeof uiExtensions.types[number]

export const uiExtensionTemplates = [
  {name: 'React', value: 'react'},
  {name: 'vanilla JavaScript', value: 'vanilla-js'},
]

export function isUiExtensionType(extensionType: string) {
  return (uiExtensions.types as ReadonlyArray<string>).includes(extensionType)
}

export const themeExtensions = {
  types: ['theme'],
} as const

export type ThemeExtensionTypes = typeof themeExtensions.types[number]

export function isThemeExtensionType(extensionType: string) {
  return (themeExtensions.types as ReadonlyArray<string>).includes(extensionType)
}

export type FunctionExtensionTypes = typeof functionExtensions.types[number]

export const extensions = {
  types: [...themeExtensions.types, ...uiExtensions.types, ...functionExtensions.types],
  publicTypes: [...themeExtensions.types, ...publicUIExtensions.types, ...publicFunctionExtensions.types],
}

export type ExtensionTypes = typeof extensions.types[number]
type PublicExtensionTypes = typeof extensions.publicTypes[number]
type GatedExtensionTypes = Exclude<ExtensionTypes, PublicExtensionTypes>

export function extensionTypeCategory(extensionType: ExtensionTypes): 'theme' | 'function' | 'ui' {
  if (extensionType === 'theme') {
    return 'theme'
  }
  if ((functionExtensions.types as ReadonlyArray<string>).includes(extensionType)) {
    return 'function'
  }
  return 'ui'
}

export function extensionTypeIsGated(extensionType: ExtensionTypes): extensionType is GatedExtensionTypes {
  return !extensions.publicTypes.includes(extensionType as PublicExtensionTypes)
}

/**
 * Returns the runtime renderer dependency for a given UI extension type.
 * @param extensionType {UIExtensionTypes} Extension type.
 * @returns The renderer dependency that should be present in the app's package.json
 */
export function getUIExtensionRendererDependency(extensionType: UIExtensionTypes): DependencyVersion | undefined {
  switch (extensionType) {
    case 'product_subscription':
      return {name: '@shopify/admin-ui-extensions-react', version: '^1.0.1'}
    case 'checkout_ui_extension':
      return {name: '@shopify/checkout-ui-extensions-react', version: '^0.18.0'}
    case 'checkout_post_purchase':
      return {name: '@shopify/post-purchase-ui-extensions-react', version: '^0.13.2'}
    case 'pos_ui_extension':
      return {name: '@shopify/retail-ui-extensions-react', version: '^0.1.0'}
    case 'customer_accounts_ui_extension':
      return {name: '@shopify/customer-account-ui-extensions-react', version: '^0.0.5'}
    case 'web_pixel_extension':
      return {name: '@shopify/web-pixels-extension', version: '^0.1.1'}
  }
}

export const uiExternalExtensionTypes = {
  types: ['web_pixel', 'post_purchase_ui', 'checkout_ui', 'pos_ui', 'subscription_ui', 'customer_acounts_ui'],
} as const

export type UIExternalExtensionTypes = typeof uiExternalExtensionTypes.types[number]

export const themeExternalExtensionTypes = {
  types: ['theme_app_extension'],
} as const

export type ThemeExternalExtensionTypes = typeof themeExternalExtensionTypes.types[number]

export const functionExternalExtensionTypes = {
  types: [
    'product_discount',
    'order_discount',
    'shipping_discount',
    'payment_customization',
    'delivery_option_presenter',
    'order_routing_ranker',
  ],
} as const

export type FunctionExternalExtensionTypes = typeof functionExternalExtensionTypes.types[number]

export const externalExtensionTypes = {
  types: [
    ...uiExternalExtensionTypes.types,
    ...themeExternalExtensionTypes.types,
    ...functionExternalExtensionTypes.types,
  ],
} as const

export type ExternalExtensionTypes = typeof externalExtensionTypes.types[number]

export const externalExtensionTypeNames = {
  types: [
    'web pixel',
    'post-purchase UI',
    'theme app extension',
    'checkout UI',
    'POS UI',
    'customer accounts UI',
    'subscription UI',
    'product discount',
    'order discount',
    'shipping discount',
    'payment customization',
    'delivery option presenter',
    'customer accounts UI',
    'order routing ranker',
  ],
} as const

export type ExternalExtensionTypeNames = typeof externalExtensionTypeNames.types[number]
export interface ExtensionOutputConfig {
  humanKey: ExternalExtensionTypeNames
  helpURL?: string
  additionalHelp?: string
}

export function getExtensionOutputConfig(extensionType: ExtensionTypes): ExtensionOutputConfig {
  switch (extensionType) {
    case 'web_pixel_extension':
      return buildExtensionOutputConfig('web pixel')
    case 'checkout_post_purchase':
      return buildExtensionOutputConfig('post-purchase UI', 'https://shopify.dev/apps/checkout/post-purchase')
    case 'theme':
      return buildExtensionOutputConfig('theme app extension')
    case 'checkout_ui_extension':
      return buildExtensionOutputConfig('checkout UI')
    case 'customer_accounts_ui_extension':
      return buildExtensionOutputConfig('customer accounts UI')
    case 'product_subscription':
      return buildExtensionOutputConfig('subscription UI')
    case 'pos_ui_extension':
      return buildExtensionOutputConfig('POS UI')
    case 'product_discounts':
      return buildExtensionOutputConfig('product discount', 'https://shopify.dev/apps/subscriptions/discounts')
    case 'order_discounts':
      return buildExtensionOutputConfig('order discount', 'https://shopify.dev/apps/subscriptions/discounts')
    case 'shipping_discounts':
      return buildExtensionOutputConfig('shipping discount', 'https://shopify.dev/apps/subscriptions/discounts')
    case 'payment_customization':
      return buildExtensionOutputConfig('payment customization')
    case 'shipping_rate_presenter':
      return buildExtensionOutputConfig('delivery option presenter')
    case 'order_routing_ranker':
      return buildExtensionOutputConfig('order routing ranker')
  }
}

/**
 * Each extension has a different ID in GraphQL.
 * Sometimes the ID is the same as the type, sometimes it's different.
 * @param type {string} The extension type
 * @returns {string} The extension GraphQL ID
 */
export const extensionGraphqlId = (type: ExtensionTypes) => {
  switch (type) {
    case 'product_subscription':
      return 'SUBSCRIPTION_MANAGEMENT'
    case 'checkout_ui_extension':
      return 'CHECKOUT_UI_EXTENSION'
    case 'checkout_post_purchase':
      return 'CHECKOUT_POST_PURCHASE'
    case 'pos_ui_extension':
      return 'POS_UI_EXTENSION'
    case 'theme':
      return 'THEME_APP_EXTENSION'
    case 'web_pixel_extension':
      return 'WEB_PIXEL_EXTENSION'
    case 'customer_accounts_ui_extension':
      return 'CUSTOMER_ACCOUNTS_UI_EXTENSION'
    case 'product_discounts':
    case 'order_discounts':
    case 'shipping_discounts':
    case 'payment_customization':
    case 'shipping_rate_presenter':
    case 'order_routing_ranker':
      // As we add new extensions, this bug will force us to add a new case here.
      return type
  }
}

function buildExtensionOutputConfig(humanKey: ExternalExtensionTypeNames, helpURL?: string, additionalHelp?: string) {
  return {
    humanKey,
    helpURL,
    additionalHelp,
  }
}
