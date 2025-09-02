"use client"

import * as React from "react"
import { User } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AccountSwitcherProps {
  onAccountChange?: (account: string) => void
  defaultAccount?: string
}

const accounts = [
  { value: "xiaowang", label: "澳洲小王Broker咨询", icon: "👨‍💼" },
  { value: "lifecar", label: "LifeCAR澳洲Broker", icon: "🚗" },
]

export function AccountSwitcher({ onAccountChange, defaultAccount = "xiaowang" }: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState(defaultAccount)

  const handleAccountChange = (account: string) => {
    setSelectedAccount(account)
    onAccountChange?.(account)
  }

  const selectedAccountData = accounts.find(a => a.value === selectedAccount)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Account:</span>
      </div>
      <Select value={selectedAccount} onValueChange={handleAccountChange}>
        <SelectTrigger className="w-[160px] sm:w-[200px] h-8 bg-white/90 backdrop-blur-sm border-purple-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-base">{selectedAccountData?.icon}</span>
              <span className="text-sm font-medium truncate">
                {selectedAccountData?.label || "Select Account"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-xl border-purple-200/50 shadow-xl z-[200]">
          {accounts.map((account) => (
            <SelectItem
              key={account.value}
              value={account.value}
              className="hover:bg-purple-50 focus:bg-purple-100 cursor-pointer text-gray-900"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{account.icon}</span>
                <span className="font-medium text-gray-900">{account.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}