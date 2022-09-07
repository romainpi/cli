export interface DeployConfig {
  deploymentToken: string
  dmsAddress: string
  healthCheck: boolean
  path: string
  commitMessage?: string
  commitAuthor?: string
  commitSha?: string
  commitRef?: string
  timestamp?: string
}
export type ReqDeployConfig = Required<DeployConfig>

export interface DMSError {
  code: string
  unrecoverable: boolean
  debugInfo: string
}

export interface UploadDeploymentResponse {
  data: {
    uploadDeployment: {
      deployment: {
        previewURL: string
      }
      error: DMSError
    }
  }
}

export interface GraphQLError {
  message: string
  extensions?: Map<string, unknown>
  locations: {
    line: number
    column: number
  }
}
