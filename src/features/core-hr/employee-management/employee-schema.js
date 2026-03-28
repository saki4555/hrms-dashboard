// import * as z from "zod";

// export const addressSchema = z
//   .object({
//     address1: z.string().min(1, "Address is required").max(100).trim(),
//     address1B: z.string().min(1, "Address (Bangla) is required").max(100).trim(),
//     country: z.string().min(1, "Country is required").max(30).trim(),
//     region: z.string().min(1, "Region is required").max(30).trim(),
//     district: z.string().min(1, "District is required").max(30).trim(),
//     upazilla: z.string().min(1, "Upazilla is required").max(30).trim(),
//     unions: z.string().min(1, "Union is required").max(30).trim(),
//     area: z.string().min(1, "Area is required").max(30).trim(),
//     effectiveStartDate: z.date({ required_error: "Effective start date is required" }),
//     effectiveEndDate: z.date({ required_error: "Effective end date is required" }),
//   })
//   .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
//     message: "Effective end date must be after start date",
//     path: ["effectiveEndDate"],
//   });

// export const employeeSchema = z
//   .object({
//     empNo: z.string().min(1, "Employee number is required").max(20).trim(),
//     title: z.string().min(1, "Title is required").max(10).trim(),
//     firstName: z.string().min(1, "First name is required").max(50).trim(),
//     lastName: z.string().min(1, "Last name is required").max(50).trim(),
//     fathersName: z.string().min(1, "Father's name is required").max(100).trim(),
//     fathersNameB: z.string().min(1, "Father's name (Bangla) is required").max(100).trim(),
//     mothersName: z.string().min(1, "Mother's name is required").max(100).trim(),
//     mothersNameB: z.string().min(1, "Mother's name (Bangla) is required").max(100).trim(),
//     gender: z.string().min(1, "Gender is required").max(10).trim(),
//     dateOfBirth: z.date({ required_error: "Date of birth is required" }),
//     nid: z.string().min(1, "NID is required").max(30).trim(),
//     birthRegNo: z.string().min(1, "Birth registration number is required").max(30).trim(),
//     townOfBirth: z.string().min(1, "Town of birth is required").max(30).trim(),
//     regionOfBirth: z.string().min(1, "Region of birth is required").max(30).trim(),
//     countryOfBirth: z.string().min(1, "Country of birth is required").max(30).trim(),
//     maritalStatus: z.string().min(1, "Marital status is required").trim(),
//     nationality: z.string().min(1, "Nationality is required").max(30).trim(),
//     joinDate: z.date({ required_error: "Join date is required" }),
//     personTypeId: z.string().min(1, "Person type is required").trim(),
//     regDisability: z.string().min(1, "Registered disability is required").trim(),
//     effectiveStartDate: z.date({ required_error: "Effective start date is required" }),
//     effectiveEndDate: z.date({ required_error: "Effective end date is required" }),
//     companyId: z.string().min(1, "Company is required").trim(),
//     ouId: z.string().min(1, "Operational Unit is required").trim(),
//     orgId: z.string().min(1, "Organization is required").trim(),
//     positionId: z.string().min(1, "Position is required").trim(),
//     orgPositionId: z.string().min(1, "Position is required").trim(),
//     payrollId: z.string().min(1, "Payroll ID is required").trim(),
//     gradeId: z.string().min(1, "Grade is required").trim(),
//     assignmentEffectiveStartDate: z.date({ required_error: "Assignment start date is required" }),
//     assignmentEffectiveEndDate: z.date({ required_error: "Assignment end date is required" }),
//     presentAddress: addressSchema,
//     permanentAddress: addressSchema,
//   })
//   .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
//     message: "Effective end date must be after start date",
//     path: ["effectiveEndDate"],
//   })
//   .refine((d) => d.assignmentEffectiveEndDate > d.assignmentEffectiveStartDate, {
//     message: "Assignment end date must be after start date",
//     path: ["assignmentEffectiveEndDate"],
//   });



import * as z from "zod";

export const addressSchema = z
  .object({
    address1: z.string().max(100).trim().optional(),
    address1B: z.string().max(100).trim().optional(),
    country: z.string().max(30).trim().optional(),
    region: z.string().max(30).trim().optional(),
    district: z.string().max(30).trim().optional(),
    upazilla: z.string().max(30).trim().optional(),
    unions: z.string().max(30).trim().optional(),
    area: z.string().max(30).trim().optional(),
    effectiveStartDate: z.date().optional(),
    effectiveEndDate: z.date().optional(),
  })
  .refine(
    (d) =>
      !d.effectiveStartDate ||
      !d.effectiveEndDate ||
      d.effectiveEndDate > d.effectiveStartDate,
    {
      message: "Effective end date must be after start date",
      path: ["effectiveEndDate"],
    }
  );

export const employeeSchema = z
  .object({
    empNo: z.string().max(20).trim().optional(),
    title: z.string().max(10).trim().optional(),
    firstName: z.string().min(1, "First name is required").max(50).trim(),
    lastName: z.string().min(1, "Last name is required").max(50).trim(),
    fathersName: z.string().max(100).trim().optional(),
    fathersNameB: z.string().max(100).trim().optional(),
    mothersName: z.string().max(100).trim().optional(),
    mothersNameB: z.string().max(100).trim().optional(),
    gender: z.string().max(10).trim().optional(),
    dateOfBirth: z.date().optional(),
    nid: z.string().max(30).trim().optional(),
    birthRegNo: z.string().max(30).trim().optional(),
    townOfBirth: z.string().max(30).trim().optional(),
    regionOfBirth: z.string().max(30).trim().optional(),
    countryOfBirth: z.string().max(30).trim().optional(),
    maritalStatus: z.string().trim().optional(),
    nationality: z.string().max(30).trim().optional(),
    joinDate: z.date().optional(),
    personTypeId: z.string().trim().optional(),
    regDisability: z.string().trim().optional(),
    effectiveStartDate: z.date().optional(),
    effectiveEndDate: z.date().optional(),
    companyId: z.string().trim().optional(),
    ouId: z.string().trim().optional(),
    orgId: z.string().trim().optional(),
    positionId: z.string().trim().optional(),
    orgPositionId: z.string().trim().optional(),
    payrollId: z.string().trim().optional(),
    gradeId: z.string().trim().optional(),
    assignmentEffectiveStartDate: z.date().optional(),
    assignmentEffectiveEndDate: z.date().optional(),
    presentAddress: addressSchema.optional(),
    permanentAddress: addressSchema.optional(),
  })
  .refine(
    (d) =>
      !d.effectiveStartDate ||
      !d.effectiveEndDate ||
      d.effectiveEndDate > d.effectiveStartDate,
    {
      message: "Effective end date must be after start date",
      path: ["effectiveEndDate"],
    }
  )
  .refine(
    (d) =>
      !d.assignmentEffectiveStartDate ||
      !d.assignmentEffectiveEndDate ||
      d.assignmentEffectiveEndDate > d.assignmentEffectiveStartDate,
    {
      message: "Assignment end date must be after start date",
      path: ["assignmentEffectiveEndDate"],
    }
  );