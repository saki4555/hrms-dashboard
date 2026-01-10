import { Spinner } from "@/components/ui/spinner"

export function PageLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">

      <Spinner  className="size-10 text-primary"/>
    </div>
  )
}