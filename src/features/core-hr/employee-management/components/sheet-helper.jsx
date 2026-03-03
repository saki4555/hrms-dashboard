// sheet-helper.js

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SheetFooter } from "@/components/ui/sheet";

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Format any date-like value → "yyyy-MM-dd" string, or null */
export const fd = (date) => {
  if (!date) return null;
  if (date instanceof Date) return format(date, "yyyy-MM-dd");
  if (typeof date === "string")
    return date.includes("T") ? date.split("T")[0] : date;
  return null;
};

/** Parse an ISO string / Date into a Date object the datepicker accepts */
export const parseDate = (s) => (s ? new Date(s) : undefined);

// ─── Payload helpers ──────────────────────────────────────────────────────────

/** Stored address object → API shape */
export const addrToPayload = (addr) => ({
  ADDRESS1: addr?.ADDRESS1 ?? null,
  ADDRESS1_B: addr?.ADDRESS1_B ?? null,
  COUNTRY: addr?.COUNTRY ?? null,
  REGION: addr?.REGION ?? null,
  DISTRICT: addr?.DISTRICT ?? null,
  UPAZILLA: addr?.UPAZILLA ?? null,
  UNIONS: addr?.UNIONS ?? null,
  AREA: addr?.AREA ?? null,
  EFFECTIVE_START_DATE: addr?.EFFECTIVE_START_DATE
    ? fd(new Date(addr.EFFECTIVE_START_DATE))
    : null,
  EFFECTIVEEND_DATE: addr?.EFFECTIVEEND_DATE
    ? fd(new Date(addr.EFFECTIVEEND_DATE))
    : null,
});

/** Stored assignment object → API shape */
export const assignToPayload = (a) => ({
  COMPANY_ID: a?.COMPANY_ID ?? null,
  OU_ID: a?.OU_ID ?? null,
  ORG_ID: a?.ORG_ID ?? null,
  POSITION_ID: a?.POSITION_ID ?? null,
  PAYROLL_ID: a?.PAYROLL_ID ?? null,
  GRADE_ID: a?.GRADE_ID ?? null,
  EFFECTIVE_START_DATE: a?.EFFECTIVE_START_DATE
    ? fd(new Date(a.EFFECTIVE_START_DATE))
    : null,
  EFFECTIVE_END_DATE: a?.EFFECTIVE_END_DATE
    ? fd(new Date(a.EFFECTIVE_END_DATE))
    : null,
});

/**
 * Returns ALL employee fields from the stored record.
 * Each sheet spreads this and overrides only its own fields, so unrelated
 * sections are always preserved in the PUT payload.
 */
export const employeeBasePayload = (e) => ({
  EMP_NO: e.EMP_NO,
  TITLE: e.TITLE,
  FIRST_NAME: e.FIRST_NAME,
  LAST_NAME: e.LAST_NAME,
  FATHERS_NAME: e.FATHERS_NAME,
  FATHERS_NAME_B: e.FATHERS_NAME_B,
  MOTHERS_NAME: e.MOTHERS_NAME,
  MOTHERS_NAME_B: e.MOTHERS_NAME_B,
  GENDER: e.GENDER,
  DATE_OF_BIRTH: fd(e.DATE_OF_BIRTH),
  NID: e.NID,
  BIRTH_REG_NO: e.BIRTH_REG_NO,
  TOWN_OF_BIRTH: e.TOWN_OF_BIRTH,
  REGION_OF_BIRTH: e.REGION_OF_BIRTH,
  COUNTRY_OF_BIRTH: e.COUNTRY_OF_BIRTH,
  MARRITIAL_STATUS: e.MARRITIAL_STATUS,
  NATIONALITY: e.NATIONALITY,
  JOIN_DATE: fd(e.JOIN_DATE),
  PERSON_TYPE_ID: e.PERSON_TYPE_ID,
  REG_DISABILITY: e.REG_DISABILITY,
  EFFECTIVE_START_DATE: fd(e.EFFECTIVE_START_DATE),
  EFFECTIVEEND_DATE: fd(e.EFFECTIVEEND_DATE),
  LAST_UPDATE_BY: 101,
});

// ─── Shared "discard unsaved changes?" dialog config ─────────────────────────

export const DISCARD_CONFIRM = {
  title: "Discard changes?",
  description:
    "You have unsaved changes. Are you sure you want to close without saving?",
  confirmText: "Discard",
  cancelText: "Keep Editing",
  variant: "destructive",
};

// ─── Shared sticky footer used by all four sheets ─────────────────────────────

export function SheetFormFooter({ onCancel, isPending }) {
  return (
    <>
      
      {/* <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2 shrink-0"> */}
        <SheetFooter className="flex flex-row justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </SheetFooter>
       
      {/* </div> */}
    </>
  );
}
