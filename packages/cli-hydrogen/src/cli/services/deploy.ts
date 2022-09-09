import {DeployConfig, ReqDeployConfig} from './deploy/types.js'
import {createDeployment, healthCheck, uploadDeployment} from './deploy/upload.js'
import {buildTaskList} from './build.js'
import {validateProject, fillDeployConfig} from './deploy/config.js'
import {environment, system, ui} from '@shopify/cli-kit'

interface TaskContext {
  config: ReqDeployConfig
  deploymentID: string
  assetBaseURL: string
  previewURL: string
}

const isUnitTest = environment.local.isUnitTest()

export async function deployToOxygen(_config: DeployConfig) {
  const backoffPolicy = [5, 10, 15, 30, 60]

  await validateProject(_config)

  /* eslint-disable require-atomic-updates */
  const tasks: ui.ListrTask<TaskContext>[] = [
    {
      title: '📝 Getting deployment config',
      task: async (ctx, task) => {
        ctx.config = await fillDeployConfig(_config)
        task.title = '📝 Deployment config parsed'
      },
    },
    {
      title: '✨ Creating a deployment',
      task: async (ctx, task) => {
        const retryCount = task.isRetrying()?.count
        if (retryCount === backoffPolicy.length) {
          throw new Error(`Could not create deployment on Oxygen. ${task.errors[task.errors.length - 1]?.message}`)
        }
        if (retryCount && !isUnitTest) await system.sleep(backoffPolicy[retryCount - 1]!)

        if (retryCount) {
          if (task.errors.length > 0) {
            const unrecoverable = task.errors.some((error) => error.message.includes('Unrecoverable'))
            if (unrecoverable) {
              return
            }
          }
        }

        const {deploymentID, assetBaseURL} = await createDeployment(ctx.config)
        ctx.assetBaseURL = assetBaseURL
        ctx.deploymentID = deploymentID
        task.title = '✨ Deployment created'
      },
      retry: 3,
    },
    {
      title: '🛠 Building project',
      task: async (ctx, task) => {
        const subTasks = buildTaskList({
          directory: ctx.config.path,
          targets: {
            client: true,
            worker: '@shopify/hydrogen/platforms/worker',
            node: false,
          },
          assetBaseURL: ctx.assetBaseURL,
        })

        return task.newListr(subTasks)
      },
    },
    {
      title: '🚀 Uploading deployment files',
      task: async (ctx, task) => {
        const retryCount = task.isRetrying()?.count
        if (retryCount === backoffPolicy.length) {
          throw new Error(`Uploading files to Oyxgen failed: ${task.errors[task.errors.length - 1]?.message}`)
        }
        if (retryCount && !isUnitTest) await system.sleep(backoffPolicy[retryCount - 1]!)

        if (retryCount) {
          if (task.errors.length > 0) {
            const unrecoverable = task.errors.some((error) => error.message.includes('Unrecoverable'))
            if (unrecoverable) {
              return
            }
          }
        }

        ctx.previewURL = await uploadDeployment(ctx.config, ctx.deploymentID)
        task.output = `Preview URL: ${ctx.previewURL}`
        task.title = '🚀 Files uploaded'
      },
      options: {
        bottomBar: Infinity,
        persistentOutput: true,
      },
      retry: backoffPolicy.length,
    },
    {
      title: '📡 Checking deployment health',
      task: async (ctx, task) => {
        const retryCount = task.isRetrying()?.count

        if (retryCount === backoffPolicy.length) {
          task.title =
            "The deployment uploaded but hasn't become reachable within 2 minutes. Check the preview URL to see if deployment succeeded. If it didn't, then try again later."
          return
        }
        if (retryCount && !isUnitTest) await system.sleep(backoffPolicy[retryCount - 1]!)

        await healthCheck(ctx.previewURL)
        task.title = '✅ Deployed and healthy!'
      },
      retry: backoffPolicy.length,
      skip: (ctx) => !ctx.config.healthCheck,
    },
  ]
  /* eslint-enable require-atomic-updates */

  const list = ui.newListr(tasks, {
    concurrent: false,
    rendererOptions: {collapse: false},
    rendererSilent: isUnitTest,
  })

  return list.run()
}
