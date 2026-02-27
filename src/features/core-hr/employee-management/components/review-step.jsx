import { format } from "date-fns";
import { CheckCircle, AlertCircle, User, BriefcaseIcon, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ReviewStep
 *
 * @param {object}  form
 * @param {array}   personTypes
 * @param {array}   companies
 * @param {array}   organizations
 * @param {array}   grades
 * @param {"add"|"edit"} mode  — controls the top alert banner
 */
export function ReviewStep({ form, personTypes, companies, organizations, grades, mode = "add" }) {
  const v = form.getValues();
  const fullName = [v.title, v.firstName, v.lastName].filter(Boolean).join(" ");

  const groups = [
    {
      title: "Personal Information",
      icon: User,
      color: "text-violet-500",
      items: [
        { label: "Full Name", value: fullName },
        { label: "Gender", value: v.gender },
        { label: "Date of Birth", value: v.dateOfBirth ? format(v.dateOfBirth, "dd MMM yyyy") : "—" },
        { label: "NID", value: v.nid },
        { label: "Marital Status", value: v.maritalStatus },
        { label: "Nationality", value: v.nationality },
        { label: "Father's Name", value: v.fathersName },
        { label: "Mother's Name", value: v.mothersName },
      ],
    },
    {
      title: "Employment",
      icon: BriefcaseIcon,
      color: "text-blue-500",
      items: [
        { label: "Employee No", value: v.empNo },
        { label: "Join Date", value: v.joinDate ? format(v.joinDate, "dd MMM yyyy") : "—" },
        { label: "Person Type", value: personTypes.find((p) => String(p.PERSON_TYPE_ID) === v.personTypeId)?.PERSON_TYPE || "—" },
        { label: "Registered Disability", value: v.regDisability === "1" ? "Yes" : "No" },
        {
          label: "Effective Dates",
          value: v.effectiveStartDate
            ? `${format(v.effectiveStartDate, "dd MMM yyyy")} → ${format(v.effectiveEndDate, "dd MMM yyyy")}`
            : "—",
        },
      ],
    },
    {
      title: "Assignment",
      icon: Building2,
      color: "text-emerald-500",
      items: [
        { label: "Company", value: companies.find((c) => String(c.COMPANY_ID) === v.companyId)?.COMPANY_NAME || "—" },
        { label: "Organization", value: organizations.find((o) => String(o.ID) === v.orgId)?.NAME || "—" },
        { label: "Payroll ID", value: v.payrollId },
        { label: "Grade", value: grades.find((g) => String(g.ID) === v.gradeId)?.GRADE || "—" },
      ],
    },
    {
      title: "Present Address",
      icon: MapPin,
      color: "text-orange-500",
      items: [
        { label: "Address", value: v.presentAddress?.address1 },
        { label: "Country", value: v.presentAddress?.country },
        { label: "Region", value: v.presentAddress?.region },
        { label: "District", value: v.presentAddress?.district },
        { label: "Upazilla", value: v.presentAddress?.upazilla },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Mode-specific banner */}
      {mode === "add" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Ready to submit</p>
            <p className="text-xs text-muted-foreground">Please review the information below before creating the employee.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Review your changes</p>
            <p className="text-xs text-muted-foreground">
              Use <strong>Correction</strong> to fix data in place, or <strong>Update</strong> to archive the current record and create a new one.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(({ title, icon: Icon, color, items }) => (
          <div key={title} className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Icon className={cn("w-4 h-4", color)} />
              <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {items.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-right truncate">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}