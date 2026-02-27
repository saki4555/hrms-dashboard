import { BriefcaseIcon, User, Building2, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";

export const STEPS = [
  {
    id: "personal",
    label: "Personal",
    icon: User,
    color: "from-violet-500 to-purple-600",
    fields: [
      "title", "firstName", "lastName", "fathersName", "fathersNameB",
      "mothersName", "mothersNameB", "gender", "dateOfBirth", "nid",
      "birthRegNo", "townOfBirth", "regionOfBirth", "countryOfBirth",
      "maritalStatus", "nationality",
    ],
  },
  {
    id: "employment",
    label: "Employment",
    icon: BriefcaseIcon,
    color: "from-blue-500 to-cyan-600",
    fields: [
      "empNo", "joinDate", "effectiveStartDate", "effectiveEndDate",
      "personTypeId", "regDisability",
    ],
  },
  {
    id: "assignment",
    label: "Assignment",
    icon: Building2,
    color: "from-emerald-500 to-teal-600",
    fields: [
      "companyId", "ouId", "orgId", "positionId", "orgPositionId",
      "payrollId", "gradeId", "assignmentEffectiveStartDate", "assignmentEffectiveEndDate",
    ],
  },
  {
    id: "address",
    label: "Address",
    icon: MapPin,
    color: "from-orange-500 to-amber-600",
    fields: ["presentAddress", "permanentAddress"],
  },
  {
    id: "review",
    label: "Review",
    icon: FileText,
    color: "from-rose-500 to-pink-600",
    fields: [],
  },
];

/** Format a Date object to "yyyy-MM-dd" string, or null */
export const fd = (date) => (date ? format(date, "yyyy-MM-dd") : null);

/** Parse a date string into a Date object, or undefined */
export const parseDate = (dateString) => {
  if (!dateString) return undefined;
  return new Date(dateString);
};