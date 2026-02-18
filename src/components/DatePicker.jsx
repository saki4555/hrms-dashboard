"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconCalendarEvent } from "@tabler/icons-react"

export function DatePicker({
  label = "",
  value,
  onChange,
  placeholder = "Select date",
  className = "w-48",
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor="date" className="px-0">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className={`${className} justify-between font-normal`}
          >
            {value ? value.toLocaleDateString() : placeholder}
            
            <IconCalendarEvent className="size-4 text-muted-foreground/50 "/>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(selected) => {
              onChange?.(selected)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
