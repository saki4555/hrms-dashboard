import React from 'react'
import { cn } from '@/lib/utils'

const PageContainer = ({ children, className }) => {
  return (
    <div className={cn('pl-2', className)}>
      {children}
    </div>
  )
}

export default PageContainer
