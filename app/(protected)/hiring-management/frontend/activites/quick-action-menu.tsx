"use client"

import { useState } from "react"
import { Button } from "@/app/frontend/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/frontend/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/frontend/components/ui/dialog"
import { Label } from "@/app/frontend/components/ui/label"
import { Textarea } from "@/app/frontend/components/ui/textarea"
import { Input } from "@/app/frontend/components/ui/input"
import { Phone, Mail, FileText, Calendar, CheckSquare, Plus } from "lucide-react"
import type { Candidate } from "../types/candidate.types"

type ActivityType = "call" | "email" | "test" | "interview" | "task"

interface QuickActionMenuProps {
  candidate: Candidate
  onActionSelect?: (actionType: ActivityType, candidate: Candidate) => void
}

const actionTypes = [
  { type: "call" as ActivityType, label: "Log Call", icon: Phone, color: "text-blue-600" },
  { type: "email" as ActivityType, label: "Send Email", icon: Mail, color: "text-green-600" },
  { type: "test" as ActivityType, label: "Schedule Test", icon: FileText, color: "text-purple-600" },
  { type: "interview" as ActivityType, label: "Schedule Interview", icon: Calendar, color: "text-orange-600" },
  { type: "task" as ActivityType, label: "Add Task", icon: CheckSquare, color: "text-pink-600" },
]

export function QuickActionMenu({ candidate, onActionSelect }: QuickActionMenuProps) {
  const handleActionClick = (type: ActivityType) => {
    onActionSelect?.(type, candidate)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e:any) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Quick actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Quick Actions</div>
        <DropdownMenuSeparator />
        {actionTypes.map((action) => (
          <DropdownMenuItem
            key={action.type}
            onClick={(e:any) => {
              e.stopPropagation()
              handleActionClick(action.type)
            }}
            className="cursor-pointer"
          >
            <action.icon className={`mr-2 h-4 w-4 ${action.color}`} />
            <span>{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
