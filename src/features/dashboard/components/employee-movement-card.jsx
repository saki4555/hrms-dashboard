// src/features/dashboard/components/employee-movement-card.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  TrendingUp,
  Award,
} from "lucide-react";

const ROWS = [
  { label: "New Joiners",     key: "newJoiners",     icon: UserPlus,       color: "text-green-600"  },
  { label: "Transfers",       key: "transfers",       icon: ArrowRightLeft, color: "text-blue-600"   },
  { label: "End Employments", key: "endEmployments",  icon: UserMinus,      color: "text-red-600"    },
  { label: "Increments",      key: "increments",      icon: TrendingUp,     color: "text-yellow-600" },
  { label: "Promotions",      key: "promotions",      icon: Award,          color: "text-purple-600" },
];

export default function EmployeeMovementCard({ movement }) {
  if (!movement) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Employee Movement
        </CardTitle>
        <span className="text-xs text-muted-foreground">This Month</span>
      </CardHeader>
      <CardContent className="space-y-1 pt-1">
        {ROWS.map(({ label, key, icon: Icon, color }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-md px-2 py-1.5"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
              {label}
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {movement[key] ?? 0}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}