import * as z from "zod";

// ─── Personal Details ─────────────────────────────────────────────────────────

export const personalSchema = z.object({
  title:          z.string().min(1, "Title is required").max(10).trim(),
  firstName:      z.string().min(1, "First name is required").max(50).trim(),
  lastName:       z.string().min(1, "Last name is required").max(50).trim(),
  fathersName:    z.string().min(1, "Father's name is required").max(100).trim(),
  fathersNameB:   z.string().min(1, "Father's name (Bangla) is required").max(100).trim(),
  mothersName:    z.string().min(1, "Mother's name is required").max(100).trim(),
  mothersNameB:   z.string().min(1, "Mother's name (Bangla) is required").max(100).trim(),
  gender:         z.string().min(1, "Gender is required").max(10),
  dateOfBirth:    z.date({ required_error: "Date of birth is required" }),
  nid:            z.string().min(1, "NID is required").max(30).trim(),
  birthRegNo:     z.string().min(1, "Birth registration is required").max(30).trim(),
  townOfBirth:    z.string().min(1, "Town of birth is required").max(30).trim(),
  regionOfBirth:  z.string().min(1, "Region of birth is required").max(30).trim(),
  countryOfBirth: z.string().min(1, "Country of birth is required").max(30).trim(),
  maritalStatus:  z.string().min(1, "Marital status is required"),
  nationality:    z.string().min(1, "Nationality is required").max(30).trim(),
  regDisability:  z.string().min(1, "Required"),
});

// ─── Employment Record ────────────────────────────────────────────────────────

export const employmentSchema = z
  .object({
    empNo:                z.string().min(1, "Employee number is required").max(20).trim(),
    joinDate:             z.date({ required_error: "Join date is required" }),
    personTypeId:         z.string().min(1, "Person type is required"),
    effectiveStartDate:   z.date({ required_error: "Start date is required" }),
    effectiveEndDate:     z.date({ required_error: "End date is required" }),
  })
  .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
    message: "End date must be after start date",
    path: ["effectiveEndDate"],
  });

// ─── Assignment ───────────────────────────────────────────────────────────────

export const assignmentSchema = z
  .object({
    companyId:                    z.string().min(1, "Company is required"),
    ouId:                         z.string().min(1, "Operational unit is required"),
    orgId:                        z.string().min(1, "Organisation is required"),
    positionId:                   z.string().min(1, "Position is required"),
    orgPositionId:                z.string().min(1, "Position is required"),
    gradeId:                      z.string().min(1, "Grade is required"),
    payrollId:                    z.string().min(1, "Payroll ID is required"),
    assignmentEffectiveStartDate: z.date({ required_error: "Start date is required" }),
    assignmentEffectiveEndDate:   z.date({ required_error: "End date is required" }),
  })
  .refine((d) => d.assignmentEffectiveEndDate > d.assignmentEffectiveStartDate, {
    message: "End date must be after start date",
    path: ["assignmentEffectiveEndDate"],
  });

// ─── Addresses ────────────────────────────────────────────────────────────────

const addrItemSchema = z
  .object({
    address1:           z.string().min(1, "Address is required").max(100).trim(),
    address1B:          z.string().min(1, "Address (Bangla) is required").max(100).trim(),
    country:            z.string().min(1, "Country is required"),
    region:             z.string().min(1, "Region is required"),
    district:           z.string().min(1, "District is required"),
    upazilla:           z.string().min(1, "Upazilla is required"),
    unions:             z.string().min(1, "Union is required").max(30).trim(),
    area:               z.string().min(1, "Area is required").max(30).trim(),
    effectiveStartDate: z.date({ required_error: "Start date is required" }),
    effectiveEndDate:   z.date({ required_error: "End date is required" }),
  })
  .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
    message: "End date must be after start date",
    path: ["effectiveEndDate"],
  });

export const addressesSchema = z.object({
  presentAddress:  addrItemSchema,
  permanentAddress: addrItemSchema,
});