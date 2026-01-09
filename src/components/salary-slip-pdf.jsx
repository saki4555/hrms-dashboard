import { useRef } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function SalarySlipPdf() {
  const slipRef = useRef(null)

  const downloadPdf = async () => {
    if (!slipRef.current) return

    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowWidth: slipRef.current.scrollWidth,
        windowHeight: slipRef.current.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save("salary-slip.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={downloadPdf}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm mb-4 transition-colors"
        >
          Download PDF
        </button>

        {/* PDF CONTENT */}
        <div
          ref={slipRef}
          className="bg-white mx-auto"
          style={{
            width: "794px",
            padding: "24px",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              textAlign: "center",
              border: "1px solid #000000",
              padding: "8px",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              Pacific Quality Control Centre Ltd. - PQC
            </div>
            <div style={{ fontSize: "11px" }}>
              Salary Statement for December 2025
            </div>
          </div>

          {/* TABLE SECTIONS */}
          <Table title="EMPLOYEE INFORMATION">
            <Row label="Name" value="Mr. Abdur Razzak" />
            <Row label="Employee ID" value="514" />
            <Row label="Designation" value="Team Leader (Q.A)" />
            <Row label="Account No" value="103.103.324264" />
          </Table>

          <Table title="SALARY COMPONENTS">
            <Row label="Gross Salary" value="30,000.00" />
            <Row label="Basic" value="18,366.67" />
            <Row label="House Rent" value="9,183.33" />
            <Row label="Medical" value="750.00" />
            <Row label="Conveyance" value="450.00" />
            <Row label="Food Allowance" value="1,250.00" />
          </Table>

          <Table title="ATTENDANCE DETAILS">
            <Row label="Working Days" value="30" />
            <Row label="Leave Taken" value="1" />
            <Row label="Absent Days" value="0" />
            <Row label="Absent Deduction" value="0" />
          </Table>

          <Table title="OTHER ADDITIONS & DEDUCTIONS">
            <Row label="Overtime Bill" value="17,251.00" />
            <Row label="Tiffin Bill" value="2,600.00" />
            <Row label="Internet Bill" value="400.00" />
            <Row label="Income Tax" value="500.00" />
            <Row label="Welfare Fund" value="918.33" />
          </Table>

          {/* NET PAY */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "12px",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "8px",
                    fontWeight: "bold",
                    width: "30%",
                  }}
                >
                  NET PAYABLE
                </td>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  55,812.67
                  <div style={{ fontSize: "10px", fontStyle: "italic", marginTop: "4px" }}>
                    In Words: Fifty-Five Thousand Eight Hundred Twelve Taka And
                    Sixty-Seven Paisa Only
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              marginTop: "16px",
            }}
          >
            This is a computer-generated document and does not require a physical
            signature.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- HELPERS ---------- */

function Table({ title, children }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "12px",
      }}
    >
      <thead>
        <tr>
          <th
            colSpan="2"
            style={{
              border: "1px solid #000000",
              textAlign: "left",
              padding: "6px",
              fontWeight: "bold",
            }}
          >
            {title}
          </th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

function Row({ label, value }) {
  return (
    <tr>
      <td
        style={{
          border: "1px solid #000000",
          padding: "6px",
          width: "40%",
          fontWeight: "bold",
        }}
      >
        {label}
      </td>
      <td
        style={{
          border: "1px solid #000000",
          padding: "6px",
        }}
      >
        {value}
      </td>
    </tr>
  )
}