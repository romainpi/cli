import extensionInit, {getRuntimeDependencies} from './extension.js'
import {
  blocks,
  configurationFileNames,
  ExtensionTypes,
  uiExtensions,
  getUIExtensionRendererDependency,
  UIExtensionTypes,
  ExternalExtensionTypes,
} from '../../constants.js'
import {load as loadApp} from '../../models/app/loader.js'
import {runGoExtensionsCLI} from '../../utilities/extensions/cli.js'
import {describe, it, expect, vi, test, beforeEach} from 'vitest'
import {file, output, path} from '@shopify/cli-kit'
import {addNPMDependenciesIfNeeded} from '@shopify/cli-kit/node/node-package-manager'

beforeEach(() => {
  vi.mock('../../utilities/extensions/cli.js')
  vi.mock('@shopify/cli-kit/node/node-package-manager')
})

describe('initialize a extension', () => {
  it(
    'successfully generates the extension when no other extensions exist',
    async () => {
      await withTemporaryApp(async (tmpDir) => {
        vi.mocked(runGoExtensionsCLI).mockRestore()
        vi.spyOn(output, 'info').mockImplementation(() => {})
        const name = 'my-ext-1'
        const extensionType = 'checkout_post_purchase'
        const externalExtensionType = 'post_purchase_ui'
        const extensionFlavor = 'vanilla-js'
        await createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir})
        const generatedExtension = (await loadApp(tmpDir)).extensions.ui[0]!
        expect(generatedExtension.configuration.name).toBe(name)
      })
    },
    30 * 1000,
  )

  it(
    'successfully generates the extension when another extension exists',
    async () => {
      await withTemporaryApp(async (tmpDir) => {
        vi.mocked(runGoExtensionsCLI).mockRestore()
        const name1 = 'my-ext-1'
        const name2 = 'my-ext-2'
        const extensionType = 'checkout_post_purchase'
        const externalExtensionType = 'post_purchase_ui'
        const extensionFlavor = 'vanilla-js'
        await createFromTemplate({
          name: name1,
          extensionType,
          externalExtensionType,
          extensionFlavor,
          appDirectory: tmpDir,
        })
        await createFromTemplate({
          name: name2,
          extensionType,
          externalExtensionType,
          extensionFlavor,
          appDirectory: tmpDir,
        })
        const addDependenciesCalls = vi.mocked(addNPMDependenciesIfNeeded).mock.calls
        expect(addDependenciesCalls.length).toEqual(2)

        const loadedApp = await loadApp(tmpDir)
        const generatedExtension2 = loadedApp.extensions.ui.sort((lhs, rhs) =>
          lhs.directory < rhs.directory ? -1 : 1,
        )[1]!
        expect(generatedExtension2.configuration.name).toBe(name2)

        const firstDependenciesCallArgs = addDependenciesCalls[0]!
        expect(firstDependenciesCallArgs[0]).toEqual([
          {name: 'react', version: '^17.0.0'},
          {name: '@shopify/post-purchase-ui-extensions-react', version: '^0.13.2'},
        ])
        expect(firstDependenciesCallArgs[1].type).toEqual('prod')
        expect(firstDependenciesCallArgs[1].directory).toEqual(loadedApp.directory)

        const secondDependencyCallArgs = addDependenciesCalls[1]!
        expect(firstDependenciesCallArgs[0]).toEqual([
          {name: 'react', version: '^17.0.0'},
          {name: '@shopify/post-purchase-ui-extensions-react', version: '^0.13.2'},
        ])
        expect(secondDependencyCallArgs[1].type).toEqual('prod')
        expect(secondDependencyCallArgs[1].directory).toEqual(loadedApp.directory)
      })
    },
    30 * 1000,
  )

  it(
    'errors when trying to re-generate an existing extension',
    async () => {
      await withTemporaryApp(async (tmpDir: string) => {
        vi.mocked(runGoExtensionsCLI).mockRestore()
        const name = 'my-ext-1'
        const extensionType = 'checkout_post_purchase'
        const externalExtensionType = 'post_purchase_ui'
        const extensionFlavor = 'vanilla-js'
        await createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir})
        await expect(
          createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir}),
        ).rejects.toThrow(`A directory with this name (${name}) already exists.\nChoose a new name for your extension.`)
      })
    },
    30 * 1000,
  )

  it(
    'generates files for the corresponding extension flavor',
    async () => {
      const extensionType = 'checkout_post_purchase'
      const externalExtensionType = 'post_purchase_ui'

      await withTemporaryApp(async (tmpDir: string) => {
        const name = 'my-ext-1'
        const extensionFlavor = 'vanilla-js'
        await createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir})
        expect(vi.mocked(runGoExtensionsCLI).mock.calls[0]![1] as any).toMatchObject({
          input: expect.stringContaining(`template: vanilla-js`),
        })
      })

      await withTemporaryApp(async (tmpDir: string) => {
        const name = 'my-ext-2'
        const extensionFlavor = 'react'
        await createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir})
        expect(vi.mocked(runGoExtensionsCLI).mock.calls[1]![1] as any).toMatchObject({
          input: expect.stringContaining(`template: react`),
        })
      })

      await withTemporaryApp(async (tmpDir: string) => {
        const name = 'my-ext-3'
        const extensionFlavor = 'typescript-react'
        await createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir})
        expect(vi.mocked(runGoExtensionsCLI).mock.calls[2]![1] as any).toMatchObject({
          input: expect.stringContaining(`template: typescript-react`),
        })
      })

      await withTemporaryApp(async (tmpDir: string) => {
        const name = 'my-ext-4'
        const extensionFlavor = 'typescript'
        await createFromTemplate({name, extensionType, externalExtensionType, extensionFlavor, appDirectory: tmpDir})
        expect(vi.mocked(runGoExtensionsCLI).mock.calls[3]![1] as any).toMatchObject({
          input: expect.stringContaining(`template: typescript`),
        })
      })
    },
    30 * 1000,
  )
})

describe('getRuntimeDependencies', () => {
  test('includes React for UI extensions', () => {
    vi.mocked(runGoExtensionsCLI).mockRestore()

    // Given
    // Web Pixel extensions don't need React as a runtime dependency.
    const extensions: UIExtensionTypes[] = [...uiExtensions.types].filter(
      (extension) => extension !== 'web_pixel_extension',
    )

    // When/then
    extensions.forEach((extensionType) => {
      const got = getRuntimeDependencies({extensionType})
      expect(got.find((dep) => dep.name === 'react' && dep.version === '^17.0.0')).toBeTruthy()
    })
  })

  test('includes the renderer package for UI extensions', () => {
    vi.mocked(runGoExtensionsCLI).mockRestore()

    // Given
    const extensions: UIExtensionTypes[] = [...uiExtensions.types]

    // When/then
    extensions.forEach((extensionType) => {
      const reference = getUIExtensionRendererDependency(extensionType)
      if (reference) {
        const got = getRuntimeDependencies({extensionType})
        expect(got.find((dep) => dep.name === reference.name && dep.version === reference.version)).toBeTruthy()
      }
    })
  })
})

interface CreateFromTemplateOptions {
  name: string
  extensionType: ExtensionTypes
  externalExtensionType: ExternalExtensionTypes
  appDirectory: string
  extensionFlavor: string
}
async function createFromTemplate({
  name,
  extensionType,
  externalExtensionType,
  appDirectory,
  extensionFlavor,
}: CreateFromTemplateOptions) {
  await extensionInit({
    name,
    extensionType,
    externalExtensionType,
    app: await loadApp(appDirectory),
    cloneUrl: 'cloneurl',
    extensionFlavor,
  })
}
async function withTemporaryApp(callback: (tmpDir: string) => Promise<void> | void) {
  await file.inTemporaryDirectory(async (tmpDir) => {
    const appConfigurationPath = path.join(tmpDir, configurationFileNames.app)
    const webConfigurationPath = path.join(tmpDir, blocks.web.directoryName, blocks.web.configurationName)

    const appConfiguration = `
      name = "my_app"
      scopes = "read_products"
      `
    const webConfiguration = `
    type = "backend"

    [commands]
    build = "./build.sh"
    dev = "./test.sh"
    `
    await file.write(appConfigurationPath, appConfiguration)
    await file.mkdir(path.dirname(webConfigurationPath))
    await file.write(webConfigurationPath, webConfiguration)
    await file.write(path.join(tmpDir, 'package.json'), JSON.stringify({dependencies: {}, devDependencies: {}}))
    // eslint-disable-next-line node/callback-return
    await callback(tmpDir)
  })
}
