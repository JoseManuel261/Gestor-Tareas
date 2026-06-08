export function logError(context: string, error: any) {
  const message = error?.message || JSON.stringify(error)
  console.error(`❌ [${context}] ${message}`, error)
}

export function logSuccess(context: string, message: string) {
  console.log(`✅ [${context}] ${message}`)
}

export function logInfo(context: string, message: string) {
  console.log(`ℹ️  [${context}] ${message}`)
}

export function logWarn(context: string, message: string) {
  console.warn(`⚠️  [${context}] ${message}`)
}
