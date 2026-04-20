import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/config/permissions'
import { useHasPermission } from '@/hooks/use-permission'
import React from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'



const Welcome = () => {
  const canDoIt = useHasPermission(PERMISSIONS.HR_SETUP);
  const navigate = useNavigate()
  console.log({canDoIt});
  return (
   <div>
    <h1 className='px-2 text-4xl font-serif pb-4'>Welcome to Dashboard</h1>
    <Button onClick={() => {
      if(canDoIt){
        toast.success("You can do it");
      }else{
        toast.error("You can't do it");
        navigate("/forbidden")
      }
    }}>Test Permission</Button>
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