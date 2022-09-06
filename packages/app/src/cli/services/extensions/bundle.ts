import {UIExtension} from '../../models/app/extensions.js'
import {build as esBuild} from 'esbuild'
import {Writable} from 'node:stream'

// const fullOptions = {...options, extensions: options.extensions, includeResourceURL: false}

//   const configuration = await extensionConfig(fullOptions)

interface BundleExtensionsOptions {
  extensions: UIExtension[]
  stdout: Writable
  stderr: Writable
  signal: AbortSignal
  buildDirectory?: string
}

export async function bundleExtensions(options: BundleExtensionsOptions) {
  await esBuild({})
}
