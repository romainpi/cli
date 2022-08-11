// CLI
import {findUpAndReadPackageJson} from './node-package-manager.js'
import {errorHandler} from './error-handler.js'
import {isDevelopment} from '../environment/local.js'
import constants, {bugsnagApiKey} from '../constants.js'
import {join, moduleDirectory} from '../path.js'
import {captureOutput, exec} from '../system.js'
import {run, settings, flush} from '@oclif/core'
import Bugsnag from '@bugsnag/js'

interface RunCLIOptions {
  /** The value of import.meta.url of the CLI executable module */
  moduleURL: string
}

/**
 * A function that abstracts away setting up the environment and running
 * a CLI
 * @param module {RunCLIOptions} Options.
 */
export async function runCLI(options: RunCLIOptions) {
  if (isDevelopment()) {
    settings.debug = true
  } else {
    Bugsnag.start({
      appType: 'node',
      apiKey: bugsnagApiKey,
      logger: null,
      appVersion: await constants.versions.cliKit(),
      autoTrackSessions: false,
      autoDetectErrors: false,
    })
  }

  run(undefined, options.moduleURL).then(flush).catch(errorHandler)
}

/**
 * A function for create-x CLIs that automatically runs the "init" command.
 * @param options
 */
export async function runCreateCLI(options: RunCLIOptions) {
  const packageJson = await findUpAndReadPackageJson(moduleDirectory(options.moduleURL))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packageName = (packageJson.content as any).name as string
  const name = packageName.replace('@shopify/create-', '')
  const initIndex = process.argv.findIndex((arg) => arg.includes('init'))
  if (initIndex === -1) {
    const initIndex =
      process.argv.findIndex((arg) => arg.match(new RegExp(`bin(\\/|\\\\)+(create-${name}|dev|run)`))) + 1
    process.argv.splice(initIndex, 0, 'init')
  }
  await runCLI(options)
}

export async function replaceGlobalCLIWithLocal(filepath: string): Promise<boolean> {
  let npmListOutput = ''
  try {
    npmListOutput = await captureOutput('npm', ['list', '@shopify/cli', '--json', '-l'])
    // eslint-disable-next-line no-catch-all/no-catch-all
  } catch (err) {
    return false
  }
  const localShopifyCLI = JSON.parse(npmListOutput)
  const cliPackage = localShopifyCLI.dependencies && localShopifyCLI.dependencies['@shopify/cli']
  if (cliPackage) {
    const correctExecutablePath = join(cliPackage.path, cliPackage.bin.shopify)
    if (correctExecutablePath === filepath) {
      // We're running the correct executable!
      return false
    } else {
      // Hand off to the correct executable
      await exec(correctExecutablePath, process.argv.slice(2, process.argv.length), {stdio: 'inherit'})
      return true
    }
  } else {
    return false
  }
}

export default runCLI
