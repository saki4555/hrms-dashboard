import React from 'react'
import { cn } from '@/lib/utils'

const PageContainer = ({ children, className }) => {
  return (
    <div
      className={cn(
        'w-full  px-3 py-3 mx-auto ',
        className
      )}
    >
      {children}
    </div>
  )
}

export default PageContainer
