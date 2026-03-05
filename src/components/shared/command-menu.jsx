import { Fragment } from 'react'
import { useNavigate } from 'react-router'
import { useSearch } from '@/context/search-provider'
import { NAV_ITEMS } from '@/config/nav-config'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

export function CommandMenu() {
  const { open, setOpen } = useSearch()
  const navigate = useNavigate()

  const handleSelect = (url) => {
    setOpen(false)
    setTimeout(() => navigate(url), 300)
    // navigate(url)
    
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Search pages...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {NAV_ITEMS.map((section, sectionIndex) => (
          <Fragment key={section.label}>
            <CommandGroup heading={section.label}>
              {section.items.map((item) =>
                item.subItems?.map((subItem) => (
                  <CommandItem
                    key={subItem.url}
                    onSelect={() => handleSelect(subItem.url)}
                  >
                    <item.icon />
                    <span>{subItem.title}</span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            {sectionIndex < NAV_ITEMS.length - 1 && <CommandSeparator />}
          </Fragment>
        ))}

      </CommandList>
    </CommandDialog>
  )
}