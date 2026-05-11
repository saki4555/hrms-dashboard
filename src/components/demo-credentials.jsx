// src/components/demo-credentials.jsx

import { Copy, Check } from "lucide-react"
import { useState } from "react"

const users = [
  { role: "All Roles", username: "asm", password: "123456" },
  { role: "Admin", username: "admin", password: "123456" },
  { role: "HR", username: "hr_user", password: "123456" },
  { role: "Supervisor", username: "supervisor_1", password: "123456" },
  { role: "Employee", username: "masud", password: "123456" },
]

export default function DemoCredentials() {
  const [copied, setCopied] = useState(null)

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 900)
  }

  return (
    <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-sm font-semibold">Demo Credentials</p>
        <p className="text-xs text-muted-foreground">
          Click ⧉ to copy values
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/10">

        {users.map((user, i) => (
          <div
            key={i}
            className="px-5 py-4  hover:bg-white/5 transition"
          >

            {/* ROLE */}
            <h2 className="text-sm pb-2 font-medium text-accent-foreground uppercase tracking-wide  w-24">
              {user.role}
            </h2>

            {/* INLINE CREDENTIALS */}
            <div className="flex items-center gap-6 text-sm">

              {/* Username */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Username:</span>
                <span className="text-foreground font-medium">
                  {user.username}
                </span>

                <button
                  onClick={() => handleCopy(user.username, `${i}-u`)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  {copied === `${i}-u` ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Password:</span>
                <span className="text-foreground font-medium">
                  {user.password}
                </span>

                <button
                  onClick={() => handleCopy(user.password, `${i}-p`)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  {copied === `${i}-p` ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

            </div>

          </div>
        ))}

      </div>
    </div>
  )
}