import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Download, Loader2, CheckCircle, XCircle } from "lucide-react";

// Zod Schema
const salarySchema = z.object({
  month: z.string().min(1, "Month is required"),
  employeeName: z.string().min(1, "Name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  designation: z.string().min(1, "Designation is required"),
  religion: z.string().min(1, "Religion is required"),
  accountNo: z.string().min(1, "Account number is required"),
  pqcCode: z.string().min(1, "PQC Code is required"),
  grossSalary: z.string().min(1, "Required"),
  basic: z.string().min(1, "Required"),
  houseRent: z.string().min(1, "Required"),
  medical: z.string().min(1, "Required"),
  conveyance: z.string().min(1, "Required"),
  foodAllowance: z.string().min(1, "Required"),
  workingDays: z.string().min(1, "Required"),
  totalWorking: z.string().min(1, "Required"),
  leaveTaken: z.string().min(1, "Required"),
  absentDays: z.string().min(1, "Required"),
  absentDeduction: z.string().min(1, "Required"),
  dueOnAttend: z.string().min(1, "Required"),
  overtimeBill: z.string().min(1, "Required"),
  tiffinBill: z.string().min(1, "Required"),
  mobileBill: z.string().min(1, "Required"),
  internetBill: z.string().min(1, "Required"),
  transportConveyance: z.string().min(1, "Required"),
  arrear: z.string().min(1, "Required"),
  advance: z.string().min(1, "Required"),
  welfareFund: z.string().min(1, "Required"),
  incomeTax: z.string().min(1, "Required"),
  whatsappNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(
      /^\+\d{1,3}\d{10,14}$/,
      "Format: +8801712345678 (with country code)",
    ),
});

// PDF Document Component
const SalarySlipDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          src="data:image/png;base64,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"
          style={styles.headerLogo}
        />
        <View style={styles.headerText}>
          <Text style={styles.companyName}>
            Pacific Quality Control Centre Ltd. - PQC
          </Text>
          <Text style={styles.headerSubtitle}>
            Salary Statement for {data.month}
          </Text>
        </View>
      </View>

      {/* Employee Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMPLOYEE INFORMATION</Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Name</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.employeeName}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Employee ID</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.employeeId}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Designation</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.designation}</Text>
            </View>
            {/* <View style={[styles.cell, styles.labelCell]}><Text>Religion</Text></View>
            <View style={styles.cell}><Text>{data.religion}</Text></View> */}
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Bank Account No</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.accountNo}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>PQC Code</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.pqcCode}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Salary Components */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SALARY BREAK DOWN</Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Gross Salary</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.grossSalary}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Basic</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.basic}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>House Rent</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.houseRent}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Medical</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.medical}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Conveyance</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.conveyance}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Food Allowance</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.foodAllowance}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Attendance Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ATTENDANCE DETAILS</Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Working Days</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.workingDays}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Leave Taken</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.leaveTaken}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Total Working</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.totalWorking}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Absent Days</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.absentDays}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Absent Deduction</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.absentDeduction}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Due on Attend</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.dueOnAttend}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Other Additions & Deductions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OTHER ADDITIONS & DEDUCTIONS</Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Overtime Bill</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.overtimeBill}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Advance</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.advance}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Tiffin Bill</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.tiffinBill}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Welfare Fund</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.welfareFund}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Mobile Bill</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.mobileBill}</Text>
            </View>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Income Tax</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.incomeTax}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Internet Bill</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.internetBill}</Text>
            </View>
            <View style={styles.cell}>
              <Text></Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Transport Bill</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.transportConveyance}</Text>
            </View>
            <View style={styles.cell}>
              <Text></Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text>Arrear</Text>
            </View>
            <View style={styles.cell}>
              <Text>{data.arrear}</Text>
            </View>
            <View style={styles.cell}>
              <Text></Text>
            </View>
          </View>
        </View>
      </View>

      {/* Net Payable */}
      <View style={styles.netPayContainer}>
        <View style={styles.netPayRow}>
          <View style={styles.netPayLabel}>
            <Text style={styles.netPayText}>NET PAYABLE:</Text>
          </View>
          <View style={styles.netPayValue}>
            <Text style={styles.netPayAmount}>{data.netPayable}</Text>
            <Text style={styles.inWords}>{data.inWords}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.remarks}>Remarks:</Text>

      <Text style={styles.footer}>
        This is a computer-generated document and does not require a physical
        signature.
      </Text>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  headerLogo: {
    width: 120,
    height: 40,
    marginRight: 10,
    objectFit: "contain",
    filter: "grayscale(100%)",
  },
  headerText: {
    flex: 1,
  },

  companyName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    backgroundColor: "#d3d3d3",
    padding: 4,
    fontSize: 10,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#000",
    borderTopWidth: 0,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  cell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    fontSize: 9,
  },
  labelCell: {
    fontWeight: "bold",
  },
  netPayContainer: {
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 10,
    marginBottom: 10,
  },
  netPayRow: {
    flexDirection: "row",
  },
  netPayLabel: {
    width: "30%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },
  netPayText: {
    fontWeight: "bold",
    fontSize: 11,
  },
  netPayValue: {
    flex: 1,
    padding: 6,
  },
  netPayAmount: {
    fontSize: 12,
    fontWeight: "bold",
  },
  inWords: {
    fontSize: 8,
    marginTop: 4,
  },
  remarks: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 15,
  },
  footer: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 20,
  },
});

export default function SalarySlipPdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // null, 'success', or 'error'
  const [statusMessage, setStatusMessage] = useState("");

  const form = useForm({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      month: "November 2025",
      employeeName: "MR. ABDUR RAZZAK",
      employeeId: "514",
      designation: "TEAMLEADER (Q.A)",
      religion: "Muslim",
      accountNo: "103.103.324264",
      pqcCode: "PQ-0514",
      grossSalary: "30,000.00",
      basic: "18,366.67",
      houseRent: "9,183.33",
      medical: "750.00",
      conveyance: "450.00",
      foodAllowance: "1,250.00",
      workingDays: "30",
      totalWorking: "31",
      leaveTaken: "1",
      absentDays: "0",
      absentDeduction: "0",
      dueOnAttend: "30000",
      overtimeBill: "17251",
      tiffinBill: "2600",
      mobileBill: "0",
      internetBill: "400",
      transportConveyance: "6980",
      arrear: "0",
      advance: "0",
      welfareFund: "918.33",
      incomeTax: "500",
       whatsappNumber: "+8801401590596",
    },
  });

  const onSave = (data) => {
    console.log("Form Data:", data);
  };

  const onDownloadPdf = async (data) => {
    setIsGenerating(true);
    try {
      const pdfData = {
        ...data,
        netPayable: "55,812.67",
        inWords:
          "In Words: Fifty-Five Thousand Eight Hundred Twelve Taka And Sixty-Seven Paisa Only",
      };

      const blob = await pdf(<SalarySlipDocument data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `salary-slip-${data.employeeId}-${data.month.replace(
        /\s+/g,
        "-",
      )}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSendWhatsApp = async (data) => {
    setIsSending(true);
    setSendStatus(null);
    setStatusMessage("");

    try {
      // Step 1: Generate PDF
      const pdfData = {
        ...data,
        netPayable: "55,812.67", // Calculate this dynamically if needed
        inWords:
          "In Words: Fifty-Five Thousand Eight Hundred Twelve Taka And Sixty-Seven Paisa Only",
      };

      const blob = await pdf(<SalarySlipDocument data={pdfData} />).toBlob();

      // Step 2: Convert PDF to Base64
      const base64PDF = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Step 3: Send to backend API
      const response = await fetch("https://ntmfpv16-4000.inc1.devtunnels.ms/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: data.whatsappNumber,
          employeeName: data.employeeName,
          month: data.month,
          pdfBase64: base64PDF,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendStatus("success");
        setStatusMessage(
          `Salary slip sent successfully to ${data.whatsappNumber}!`,
        );
      } else {
        setSendStatus("error");
        setStatusMessage(result.error || "Failed to send WhatsApp message");
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      setSendStatus("error");
      setStatusMessage(error.message || "Failed to send WhatsApp message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Salary Slip Generator</h1>

      <Form {...form}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Month/Period <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., November 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Employee Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MR. ABDUR RAZZAK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Employee ID <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 514" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Designation <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Team Leader" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="religion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Religion <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Muslim" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Account No <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 103.103.324264" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pqcCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      PQC Code <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PQ-0514" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Components</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="grossSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Gross Salary <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="30,000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Basic <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="18,366.67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="houseRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      House Rent <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="9,183.33" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Medical <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="750.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conveyance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Conveyance <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="450.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foodAllowance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Food Allowance <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="1,250.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="workingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Working Days <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalWorking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Total Working <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leaveTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Leave Taken <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="absentDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Absent Days <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="absentDeduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Absent Deduction{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueOnAttend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Due on Attend <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="30000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Additions & Deductions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="overtimeBill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Overtime Bill <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="17251" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tiffinBill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tiffin Bill <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="2600" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileBill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mobile Bill <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="internetBill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Internet Bill <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transportConveyance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Transport/Conveyance{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="6980" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Arrear <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="advance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Advance <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="welfareFund"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Welfare Fund <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="918.33" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="incomeTax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Income Tax <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="whatsappNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  WhatsApp Number <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="+8801712345678" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +880 for Bangladesh)
                </p>
              </FormItem>
            )}
          />

         <div className="flex gap-4">
  <Button
    type="button"
    variant="outline"
    onClick={form.handleSubmit(onSave)}
  >
    Save Data
  </Button>
  
  <Button
    type="button"
    onClick={form.handleSubmit(onDownloadPdf)}
    disabled={isGenerating || isSending}
  >
    <Download className="mr-2 h-4 w-4" />
    {isGenerating ? "Generating..." : "Download PDF"}
  </Button>

  <Button
    type="button"
    onClick={form.handleSubmit(onSendWhatsApp)}
    disabled={isSending || isGenerating}
    className="bg-green-600 hover:bg-green-700"
  >
    {isSending ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Sending...
      </>
    ) : (
      <>
        <Send className="mr-2 h-4 w-4" />
        Send to WhatsApp
      </>
    )}
  </Button>
</div>

          {sendStatus && (
            <Alert
              variant={sendStatus === "success" ? "default" : "destructive"}
            >
              <AlertDescription className="flex items-center gap-2">
                {sendStatus === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Form>
    </div>
  );
}
