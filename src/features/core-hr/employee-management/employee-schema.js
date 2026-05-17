// src\features\core-hr\employee-management\employee-schema.js



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
    // payrollId: z.string().trim().optional(),
    payStructureId: z.string().trim().optional(),
    shiftId: z.string().optional(),
    locationId: z.string().optional(),      
supervisorId: z.number().optional(),    
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