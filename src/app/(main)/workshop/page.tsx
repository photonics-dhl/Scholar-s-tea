import { Suspense } from 'react'
import WorkshopClient from './WorkshopClient'

function WorkshopFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-tea-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">加载思想工坊...</p>
      </div>
    </div>
  )
}

export default function WorkshopPage() {
  return (
    <Suspense fallback={<WorkshopFallback />}>
      <WorkshopClient />
    </Suspense>
  )
}
