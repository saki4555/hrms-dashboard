import { toast } from 'sonner'

export function showSubmittedData(
  data,
  title= 'You submitted the following values:'
) {
  toast.message(title, {
    description: (
      // w-[340px]
      <pre className='mt-2 w-full overflow-x-auto rounded-md bg-green-700 p-4'>
        <code className='text-white break-right'>{JSON.stringify(data, null, 2)}</code>
      </pre>
    ),
  })
}
