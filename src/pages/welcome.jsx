import React from 'react'

const Welcome = () => {
  return (
   <div>
    <h1 className='px-2 text-4xl font-serif pb-4'>Welcome to Dashboard</h1>
      <div className="flex flex-1 flex-col gap-4 px-2">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className={`bg-muted/50 ${index % 2 && "animate-pulse"} aspect-video h-12 w-full rounded-lg`}
            />
          ))}
        </div>
   </div>
  )
}

export default Welcome