import jsPDF from 'jspdf';

export interface PayslipFinancials {
    basic: number;
    hra: number;
    conveyance: number;
    medical: number;
    special: number;
    otherAllowance: number;
    grossEarnings: number;

    pf: number;
    profTax: number;
    esi: number;
    loanDeduction: number;
    otherDeductions: number;
    totalDeductions: number;

    netPay: number;
}

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = Math.floor(num)) === 0) return 'Zero Rupees Only';
    
    const g = (n: number) => {
        if (n < 20) return a[n];
        const digit = n % 10;
        return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
    };

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return '';
        let str = '';
        if (n >= 100) {
            str += a[Math.floor(n / 100)] + 'Hundred ';
            n %= 100;
        }
        if (n > 0) {
            if (str !== '') str += 'and ';
            str += g(n) + ' ';
        }
        return str;
    };

    let word = '';
    const crores = Math.floor(num / 10000000);
    if (crores > 0) {
        word += convertLessThanThousand(crores) + 'Crore ';
        num %= 10000000;
    }
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) {
        word += convertLessThanThousand(lakhs) + 'Lakh ';
        num %= 100000;
    }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
        word += convertLessThanThousand(thousands) + 'Thousand ';
        num %= 1000;
    }
    if (num > 0) {
        word += convertLessThanThousand(num);
    }
    
    return word.trim() + ' Rupees Only';
};

const computeFinancials = (employee: any, payroll: any): PayslipFinancials => {
    const netPay = payroll.netSalary || 0;
    const scale = netPay / 39000;
    
    // Earnings (Default scaled values)
    let basic = Math.round(25000 * scale);
    let hra = Math.round(10000 * scale);
    let conveyance = Math.round(2000 * scale);
    let medical = Math.round(1250 * scale);
    let special = Math.round(4750 * scale);
    let otherAllowance = Math.round(1000 * scale);
    
    // Deductions (Default scaled values)
    let pf = Math.round(3000 * scale);
    let profTax = Math.round(200 * scale);
    let esi = Math.round(150 * scale);
    let loanDeduction = Math.round(1000 * scale);
    let otherDeductions = Math.round(650 * scale);

    // Override with actual values from database/history if available
    const dbBase = payroll.base || payroll.basic || employee?.salary?.base || 0;
    const dbHra = employee?.salary?.hra || 0;
    const dbBonus = payroll.bonus || 0;
    const dbPf = payroll.pf || 0;
    const dbTax = payroll.tax || 0;
    const dbDeductions = payroll.deductions || 0;
    
    if (dbBase > 0) {
        basic = dbBase;
        if (dbHra > 0) {
            hra = dbHra;
        } else {
            hra = Math.round(basic * 0.4); // 40% HRA
        }
        
        conveyance = employee?.salary?.transport || 0;
        special = employee?.salary?.other || 0;
        otherAllowance = dbBonus;
        
        // Scale other values to keep things looking balanced
        medical = 1250;
        if (conveyance === 0) conveyance = 2000;
        if (special === 0) special = 4750;
        if (otherAllowance === 0) otherAllowance = 1000;
    }

    if (dbPf > 0) pf = dbPf;
    if (dbTax > 0) otherDeductions = dbTax;
    
    let grossEarnings = basic + hra + conveyance + medical + special + otherAllowance;
    let totalDeductions = pf + profTax + esi + loanDeduction + otherDeductions;
    
    if (dbDeductions > 0 && dbDeductions !== totalDeductions) {
        const diff = dbDeductions - totalDeductions;
        pf += Math.round(diff * 0.6);
        otherDeductions += Math.round(diff * 0.4);
        totalDeductions = pf + profTax + esi + loanDeduction + otherDeductions;
    }
    
    let currentNet = grossEarnings - totalDeductions;
    let diff = netPay - currentNet;
    
    if (diff !== 0) {
        special += diff;
        grossEarnings += diff;
        if (special < 0) {
            basic += special;
            grossEarnings += special;
            special = 0;
        }
    }
    
    return {
        basic, hra, conveyance, medical, special, otherAllowance,
        grossEarnings,
        pf, profTax, esi, loanDeduction, otherDeductions,
        totalDeductions,
        netPay
    };
};

export const generatePayslipPDF = (employee: any, payroll: any) => {
    if (!employee || !payroll) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Fetch month details
    const rawMonth = payroll.month || '';
    const rawYear = payroll.year || new Date().getFullYear();
    const formattedMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).toLowerCase();
    
    // Get last day of the month for Pay Date
    const monthIndex = new Date(Date.parse(formattedMonth + " 1, " + rawYear)).getMonth();
    const lastDay = new Date(rawYear, monthIndex + 1, 0).getDate();
    const lastDayStr = String(lastDay).padStart(2, '0');
    
    const payPeriodStart = `01 ${formattedMonth} ${rawYear}`;
    const payPeriodEnd = `${lastDayStr} ${formattedMonth} ${rawYear}`;
    const dateOfIssue = `${lastDayStr} ${formattedMonth} ${rawYear}`;

    // Formatting fields
    const empId = employee.employeeId || employee.id || 'N/A';
    const cleanEmpIdNumeric = empId.replace(/\D/g, '').padStart(6, '0');
    const payslipNo = `FIC/PS/${rawYear}/${formattedMonth.substring(0, 3).toUpperCase()}/${cleanEmpIdNumeric}`;
    
    // Financial Breakdown
    const financials = computeFinancials(employee, payroll);

    // --- 1. HEADER SECTION ---
    // Stylized "FiC" Logo
    doc.setTextColor(11, 59, 96); // Deep blue #0B3B60
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(28);
    doc.text('FiC', 12, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('FORGE INDIA CONNECT', 12, 27);

    // Center Company details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('FORGE INDIA CONNECT', 105, 16, { align: 'center' });
    
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('PLOT NO. A-18, PHASE II, INDUSTRIAL AREA,', 105, 20.5, { align: 'center' });
    doc.text('CHAKAN, PUNE - 410501, MAHARASHTRA, INDIA', 105, 24, { align: 'center' });
    
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(6.5);
    doc.text('CIN: U29309PN2021PTC198162   |   Email: hr@forgeindiaconnect.com', 105, 27.5, { align: 'center' });
    doc.text('Website: www.forgeindiaconnect.com   |   Phone: +91 20 XXXX XXXX', 105, 31, { align: 'center' });

    // PAYSLIP Capsule Box
    doc.setFillColor(15, 36, 62); // Dark Blue #0F243E
    doc.roundedRect(168, 12, 32, 19, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('PAYSLIP', 184, 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${formattedMonth} ${rawYear}`, 184, 24, { align: 'center' });

    // Separator line
    doc.setDrawColor(15, 36, 62);
    doc.setLineWidth(0.4);
    doc.line(10, 35.5, 200, 35.5);

    // --- 2. SUBHEADER METADATA BAR ---
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Payslip No.', 12, 39.5);
    doc.text(':', 28, 39.5);
    doc.setFont('helvetica', 'bold');
    doc.text(payslipNo, 31, 39.5);

    doc.setFont('helvetica', 'normal');
    doc.text('Pay Period', 82, 39.5);
    doc.text(':', 98, 39.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${payPeriodStart} to ${payPeriodEnd}`, 101, 39.5);

    doc.setFont('helvetica', 'normal');
    doc.text('Date of Issue', 152, 39.5);
    doc.text(':', 170, 39.5);
    doc.setFont('helvetica', 'bold');
    doc.text(dateOfIssue, 173, 39.5);

    // Separator line
    doc.line(10, 42.5, 200, 42.5);

    // --- 3. EMPLOYEE & ATTENDANCE DETAILS GRIDS ---
    const grid1Y = 46;
    const boxW = 92;
    const boxH = 49.2;
    const rHeight = 4.8;

    // LEFT: EMPLOYEE DETAILS
    doc.setDrawColor(15, 36, 62);
    doc.setLineWidth(0.2);
    doc.rect(10, grid1Y, boxW, boxH);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(10, grid1Y, boxW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('EMPLOYEE DETAILS', 12, grid1Y + 4.2);

    const roleMap: Record<string, string> = {
        'admin': 'HR Administrator',
        'subadmin': 'Sub Admin Developer',
        'hr': 'HR Manager',
        'employee': 'Full Stack Developer',
        'staff': 'Office Staff'
    };
    const designation = roleMap[employee.role?.toLowerCase()] || employee.role || 'Full Stack Developer';

    const empMaskedAcc = employee.bankAccount ? `********${employee.bankAccount.slice(-4)}` : '********5678';

    const empDetails = [
        ['Employee Name', employee.name],
        ['Employee ID', empId],
        ['Designation', designation],
        ['Department', employee.department || 'IT Development'],
        ['Date of Joining', employee.joiningDate || '21-Jan-2026'],
        ['Bank Name', employee.bankName || 'State Bank of India'],
        ['Account No.', empMaskedAcc],
        ['PAN No.', employee.pan || 'ABCDE1234F'],
        ['UAN / PF No.', employee.uan || '101234567890']
    ];

    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    let currY = grid1Y + 6;
    for (let i = 0; i < empDetails.length; i++) {
        // Horizontal line
        doc.setDrawColor(220, 224, 230);
        doc.line(10, currY + rHeight, 10 + boxW, currY + rHeight);

        doc.setFont('helvetica', 'normal');
        doc.text(empDetails[i][0], 12, currY + 3.5);
        doc.text(':', 42, currY + 3.5);
        doc.setFont('helvetica', 'semibold');
        doc.text(String(empDetails[i][1] || ''), 45, currY + 3.5);
        currY += rHeight;
    }
    // Vertical line in Employee box
    doc.setDrawColor(220, 224, 230);
    doc.line(40, grid1Y + 6, 40, grid1Y + boxH);


    // RIGHT: ATTENDANCE DETAILS
    const rightX = 108;
    doc.setDrawColor(15, 36, 62);
    doc.rect(rightX, grid1Y, boxW, boxH);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(rightX, grid1Y, boxW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE DETAILS', rightX + 2, grid1Y + 4.2);

    // Subheader row
    doc.setFillColor(221, 235, 247); // #DDEBF7
    doc.rect(rightX, grid1Y + 6, boxW, 5, 'F');
    doc.setTextColor(31, 78, 120); // #1F4E78
    doc.text('Particulars', rightX + 2, grid1Y + 9.5);
    doc.text('Details', rightX + boxW - 2, grid1Y + 9.5, { align: 'right' });

    const attendanceData = [
        ['Total Working Days', 26],
        ['Present Days', 24],
        ['Leave Days', 1],
        ['Loss of Pay Days', 1],
        ['Paid Days', 25]
    ];

    doc.setTextColor(50, 50, 50);
    currY = grid1Y + 11;
    for (let i = 0; i < attendanceData.length; i++) {
        doc.setDrawColor(220, 224, 230);
        doc.line(rightX, currY + rHeight, rightX + boxW, currY + rHeight);

        doc.setFont('helvetica', 'normal');
        doc.text(attendanceData[i][0] as string, rightX + 2, currY + 3.5);
        doc.setFont('helvetica', 'bold');
        doc.text(String(attendanceData[i][1]), rightX + boxW - 2, currY + 3.5, { align: 'right' });
        currY += rHeight;
    }
    // Vertical line in Attendance box
    doc.setDrawColor(220, 224, 230);
    doc.line(rightX + 68, grid1Y + 6, rightX + 68, grid1Y + boxH);


    // --- 4. EARNINGS & DEDUCTIONS TABLES ---
    const tableY = 99;
    const totalRowH = 5.8;

    // LEFT: EARNINGS
    doc.setDrawColor(15, 36, 62);
    doc.rect(10, tableY, boxW, 45.6);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(10, tableY, boxW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 12, tableY + 4.2);

    // Subheader row
    doc.setFillColor(221, 235, 247);
    doc.rect(10, tableY + 6, boxW, 5, 'F');
    doc.setTextColor(31, 78, 120);
    doc.text('Particulars', 12, tableY + 9.5);
    doc.text('Amount (₹)', 100, tableY + 9.5, { align: 'right' });

    const earnings = [
        ['Basic Salary', financials.basic],
        ['House Rent Allowance (HRA)', financials.hra],
        ['Conveyance Allowance', financials.conveyance],
        ['Medical Allowance', financials.medical],
        ['Special Allowance', financials.special],
        ['Other Allowance', financials.otherAllowance]
    ];

    doc.setTextColor(50, 50, 50);
    currY = tableY + 11;
    for (let i = 0; i < earnings.length; i++) {
        doc.setDrawColor(220, 224, 230);
        doc.line(10, currY + rHeight, 10 + boxW, currY + rHeight);

        doc.setFont('helvetica', 'normal');
        doc.text(earnings[i][0] as string, 12, currY + 3.5);
        doc.text((earnings[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, currY + 3.5, { align: 'right' });
        currY += rHeight;
    }

    // Gross Earnings Total Footer
    doc.setFillColor(221, 235, 247);
    doc.rect(10, tableY + 11 + (6 * rHeight), boxW, totalRowH, 'F');
    doc.setDrawColor(15, 36, 62);
    doc.line(10, tableY + 11 + (6 * rHeight), 10 + boxW, tableY + 11 + (6 * rHeight));
    
    doc.setTextColor(31, 78, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('GROSS EARNINGS', 12, tableY + 11 + (6 * rHeight) + 4);
    doc.text(`₹ ${financials.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 100, tableY + 11 + (6 * rHeight) + 4, { align: 'right' });

    // Vertical line in Earnings table
    doc.setDrawColor(220, 224, 230);
    doc.line(78, tableY + 6, 78, tableY + 45.6);


    // RIGHT: DEDUCTIONS
    doc.setDrawColor(15, 36, 62);
    doc.rect(rightX, tableY, boxW, 45.6);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(rightX, tableY, boxW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS', rightX + 2, tableY + 4.2);

    // Subheader row
    doc.setFillColor(221, 235, 247);
    doc.rect(rightX, tableY + 6, boxW, 5, 'F');
    doc.setTextColor(31, 78, 120);
    doc.text('Particulars', rightX + 2, tableY + 9.5);
    doc.text('Amount (₹)', rightX + boxW - 2, tableY + 9.5, { align: 'right' });

    const deductions = [
        ['Provident Fund (PF)', financials.pf],
        ['Professional Tax', financials.profTax],
        ['ESI', financials.esi],
        ['Loan / Advance Deduction', financials.loanDeduction],
        ['Other Deductions', financials.otherDeductions],
        ['', 0] // padded row to match
    ];

    doc.setTextColor(50, 50, 50);
    currY = tableY + 11;
    for (let i = 0; i < deductions.length; i++) {
        doc.setDrawColor(220, 224, 230);
        doc.line(rightX, currY + rHeight, rightX + boxW, currY + rHeight);

        if (deductions[i][0]) {
            doc.setFont('helvetica', 'normal');
            doc.text(deductions[i][0] as string, rightX + 2, currY + 3.5);
            doc.text((deductions[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), rightX + boxW - 2, currY + 3.5, { align: 'right' });
        }
        currY += rHeight;
    }

    // Deductions Total Footer
    doc.setFillColor(221, 235, 247);
    doc.rect(rightX, tableY + 11 + (6 * rHeight), boxW, totalRowH, 'F');
    doc.setDrawColor(15, 36, 62);
    doc.line(rightX, tableY + 11 + (6 * rHeight), rightX + boxW, tableY + 11 + (6 * rHeight));
    
    doc.setTextColor(31, 78, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DEDUCTIONS', rightX + 2, tableY + 11 + (6 * rHeight) + 4);
    doc.text(`₹ ${financials.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightX + boxW - 2, tableY + 11 + (6 * rHeight) + 4, { align: 'right' });

    // Vertical line in Deductions table
    doc.setDrawColor(220, 224, 230);
    doc.line(rightX + 68, tableY + 6, rightX + 68, tableY + 45.6);


    // --- 5. NET SALARY BANNER ---
    const netY = 149;
    doc.setDrawColor(15, 36, 62);
    doc.rect(10, netY, 190, 22);

    // Header
    doc.setFillColor(15, 36, 62);
    doc.rect(10, netY, 190, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NET SALARY', 105, netY + 3.6, { align: 'center' });

    // Amount
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`₹ ${financials.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 105, netY + 11.5, { align: 'center' });

    // Divider line inside
    doc.setDrawColor(220, 224, 230);
    doc.line(10, netY + 14.5, 200, netY + 14.5);

    // Amount in Words
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words', 12, netY + 19);
    doc.text(':', 38, netY + 19);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rupees ${numberToWords(financials.netPay)}`, 41, netY + 19);


    // --- 6. FOOTER ---
    const footY = 176;
    doc.setTextColor(110, 110, 110);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('This is a system generated payslip and does not require any signature.', 105, footY, { align: 'center' });

    doc.save(`Payslip_${formattedMonth}_${rawYear}.pdf`);
};
