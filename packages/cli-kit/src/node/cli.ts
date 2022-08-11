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
  if (process.env.SHOPIFY_SKIP_CLI_REDIRECT) return false
  if (process.env.npm_config_user_agent) return false

  const cliPackage = await localCliPackage()
  if (!cliPackage) return false

  const correctExecutablePath = join(cliPackage.path, cliPackage.bin.shopify)
  if (correctExecutablePath === filepath) return false
  try {
    await exec(correctExecutablePath, process.argv.slice(2, process.argv.length), {
      stdio: 'inherit',
      env: {SHOPIFY_SKIP_CLI_REDIRECT: '1'},
    })
    // eslint-disable-next-line no-catch-all/no-catch-all, @typescript-eslint/no-explicit-any
  } catch (processError: any) {
    process.exit(processError.exitCode)
  }
  return true
}

interface CliPackageInfo {
  path: string
  bin: {shopify: string}
}

async function localCliPackage(): Promise<CliPackageInfo | undefined> {
  let npmListOutput = ''
  try {
    npmListOutput = await captureOutput('npm', ['list', '@shopify/cli', '--json', '-l'])
    // eslint-disable-next-line no-catch-all/no-catch-all
  } catch (err) {
    return
  }
  const localShopifyCLI = JSON.parse(npmListOutput)
  const dependenciesList =
    localShopifyCLI.dependencies ?? localShopifyCLI.devDependencies ?? localShopifyCLI.peerDependencies
  return dependenciesList && dependenciesList['@shopify/cli']
}

export default runCLI
