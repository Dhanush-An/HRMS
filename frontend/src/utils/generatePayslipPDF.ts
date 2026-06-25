import jsPDF from 'jspdf';
import logo from '../assets/forge india logo.jpg';

const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
    });
};

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
    lopDeduction: number;
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

export const computeFinancials = (employee: any, payroll: any): PayslipFinancials => {
    // 1. Get deductions from payroll or employee structure
    const pf = payroll.pf !== undefined && payroll.pf !== null ? payroll.pf : (employee?.salary?.pf || 0);
    const profTax = payroll.tax !== undefined && payroll.tax !== null ? payroll.tax : (employee?.salary?.tax || 0);
    const esi = payroll.esi !== undefined && payroll.esi !== null ? payroll.esi : (employee?.salary?.esi || 0);
    const loanDeduction = payroll.loanDeduction !== undefined && payroll.loanDeduction !== null ? payroll.loanDeduction : 0;
    const otherDeductions = payroll.otherDeductions !== undefined && payroll.otherDeductions !== null ? payroll.otherDeductions : 0;

    // 2. Get Net Pay
    const netPay = payroll.netSalary || 0;
    const bonus = payroll.bonus || 0;

    // Get configured salary structure from employee
    const struct = employee?.salary || { basic: 0, hra: 0, conveyance: 0, medical: 0, special: 0, other: 0 };
    const basic = struct.basic || 0;
    const hra = struct.hra || 0;
    const conveyance = struct.conveyance || struct.transport || 0;
    const medical = struct.medical || 0;
    const special = struct.special || 0;
    const otherAllowance = (struct.other || 0) + bonus;

    const configuredGross = basic + hra + conveyance + medical + special + (struct.other || 0);
    const grossEarnings = basic + hra + conveyance + medical + special + otherAllowance;

    // Calculate actual base gross (gross before deductions and bonus)
    const actualBaseGross = netPay + pf + profTax + esi + loanDeduction + otherDeductions - bonus;
    
    // LOP is configured gross minus actual gross
    const lopDeduction = Math.max(0, Math.round(configuredGross - actualBaseGross));
    const totalDeductions = pf + profTax + esi + loanDeduction + otherDeductions + lopDeduction;

    return {
        basic,
        hra,
        conveyance,
        medical,
        special,
        otherAllowance,
        grossEarnings,
        pf,
        profTax,
        esi,
        loanDeduction,
        otherDeductions,
        lopDeduction,
        totalDeductions,
        netPay
    };
};


export const generatePayslipPDF = async (employee: any, payroll: any, attendanceStats?: any) => {
    if (!employee || !payroll) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Fetch month details
    let rawMonth = payroll.month || '';
    let rawYear = payroll.year || new Date().getFullYear();
    
    // Clean rawMonth if it has year (e.g. "June 2026")
    if (typeof rawMonth === 'string') {
        rawMonth = rawMonth.replace(/\s+/g, ' ').trim();
        if (rawMonth.includes(' ')) {
            const parts = rawMonth.split(' ');
            rawMonth = parts[0];
            rawYear = parseInt(parts[1]) || rawYear;
        }
    }
    
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
    // Company Logo
    try {
        const img = await loadImage(logo);
        doc.addImage(img, 'JPEG', 12, 11, 18, 18);
    } catch (e) {
        console.error('Failed to load company logo', e);
        // Fallback text logo
        doc.setTextColor(11, 59, 96);
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(26);
        doc.text('FiC', 12, 22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('FORGE INDIA CONNECT PVT. LTD.', 12, 27);
    }

    // Center Company details
    doc.setTextColor(15, 36, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('FORGE INDIA CONNECT PVT. LTD.', 105, 16, { align: 'center' });
    
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('1st & 2nd Floor, No 62, 11th Block, Marilingappa Extension,', 105, 21, { align: 'center' });
    doc.text('Nagarbhavi, Bengaluru, Karnataka - 560072', 105, 25, { align: 'center' });
    
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(7.5);
    doc.text('Email: hr@forgeindiaconnect.com', 105, 29, { align: 'center' });
    doc.text('Website: www.forgeindiaconnect.com   |   Phone: +91 6369406416', 105, 33, { align: 'center' });

    // PAYSLIP Capsule Box
    doc.setFillColor(15, 36, 62); // Dark Blue #0F243E
    doc.roundedRect(168, 11, 32, 22, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PAYSLIP', 184, 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${formattedMonth} ${rawYear}`, 184, 25, { align: 'center' });

    // Separator line
    doc.setDrawColor(15, 36, 62);
    doc.setLineWidth(0.4);
    doc.line(10, 39, 200, 39);

    // --- 2. SUBHEADER METADATA BAR ---
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Payslip No.', 12, 44);
    doc.text(':', 28, 44);
    doc.setFont('helvetica', 'bold');
    doc.text(payslipNo, 31, 44);

    doc.setFont('helvetica', 'normal');
    doc.text('Pay Period', 82, 44);
    doc.text(':', 98, 44);
    doc.setFont('helvetica', 'bold');
    doc.text(`${payPeriodStart} to ${payPeriodEnd}`, 101, 44);

    doc.setFont('helvetica', 'normal');
    doc.text('Date of Issue', 152, 44);
    doc.text(':', 170, 44);
    doc.setFont('helvetica', 'bold');
    doc.text(dateOfIssue, 173, 44);

    // Separator line
    doc.line(10, 47.5, 200, 47.5);

    // --- 3. EMPLOYEE & ATTENDANCE DETAILS GRIDS ---
    const grid1Y = 53;
    const boxW = 92;
    const boxH = 62;
    const rHeight = 6.0;

    // LEFT: EMPLOYEE DETAILS
    doc.setDrawColor(15, 36, 62);
    doc.setLineWidth(0.2);
    doc.rect(10, grid1Y, boxW, boxH);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(10, grid1Y, boxW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('EMPLOYEE DETAILS', 12, grid1Y + 5.5);

    const roleMap: Record<string, string> = {
        'admin': 'HR Administrator',
        'subadmin': 'Sub Admin Developer',
        'hr': 'HR Manager',
        'employee': 'Full Stack Developer',
        'staff': 'Office Staff'
    };
    const designation = roleMap[employee.role?.toLowerCase()] || employee.role || 'Full Stack Developer';

    const empMaskedAcc = employee.bankAccount ? `********${employee.bankAccount.slice(-4)}` : '-';

    const empDetails = [
        ['Employee Name', employee.name],
        ['Employee ID', empId],
        ['Designation', designation],
        ['Department', employee.department || 'IT Development'],
        ['Date of Joining', employee.joiningDate || '-'],
        ['Bank Name', employee.bankName || '-'],
        ['Account No.', empMaskedAcc],
        ['PAN No.', employee.pan || '-'],
        ['UAN / PF No.', `${employee.uan || '-'} / ${employee.pfNo || '-'}`]
    ];

    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    let currY = grid1Y + 8;
    for (let i = 0; i < empDetails.length; i++) {
        // Horizontal line
        doc.setDrawColor(220, 224, 230);
        doc.line(10, currY + rHeight, 10 + boxW, currY + rHeight);

        doc.setFont('helvetica', 'normal');
        doc.text(empDetails[i][0], 12, currY + 4.2);
        doc.text(':', 40, currY + 4.2);
        doc.setFont('helvetica', 'semibold');
        doc.text(String(empDetails[i][1] || ''), 43, currY + 4.2);
        currY += rHeight;
    }
    // Vertical line in Employee box
    doc.setDrawColor(220, 224, 230);
    doc.line(38, grid1Y + 8, 38, grid1Y + boxH);


    // RIGHT: ATTENDANCE DETAILS
    const rightX = 108;
    doc.setDrawColor(15, 36, 62);
    doc.rect(rightX, grid1Y, boxW, boxH);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(rightX, grid1Y, boxW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE DETAILS', rightX + 2, grid1Y + 5.5);

    // Subheader row
    doc.setFillColor(221, 235, 247); // #DDEBF7
    doc.rect(rightX, grid1Y + 8, boxW, 6, 'F');
    doc.setTextColor(31, 78, 120); // #1F4E78
    doc.text('Particulars', rightX + 2, grid1Y + 12.2);
    doc.text('Details', rightX + boxW - 2, grid1Y + 12.2, { align: 'right' });

    const attendanceData = [
        ['Total Working Days', attendanceStats?.totalWorkingDays !== undefined ? attendanceStats.totalWorkingDays : 26],
        ['Present Days', attendanceStats?.presentDays !== undefined ? attendanceStats.presentDays : 24],
        ['Leave Days', attendanceStats?.leaveDays !== undefined ? attendanceStats.leaveDays : 1],
        ['Loss of Pay Days', attendanceStats?.lossOfPayDays !== undefined ? attendanceStats.lossOfPayDays : 1],
        ['Paid Days', attendanceStats?.paidDays !== undefined ? attendanceStats.paidDays : 25]
    ];

    doc.setTextColor(50, 50, 50);
    const attRowH = 9.6;
    currY = grid1Y + 14;
    for (let i = 0; i < attendanceData.length; i++) {
        doc.setDrawColor(220, 224, 230);
        doc.line(rightX, currY + attRowH, rightX + boxW, currY + attRowH);

        doc.setFont('helvetica', 'normal');
        doc.text(attendanceData[i][0] as string, rightX + 2, currY + 6.0);
        doc.setFont('helvetica', 'bold');
        doc.text(String(attendanceData[i][1]), rightX + boxW - 2, currY + 6.0, { align: 'right' });
        currY += attRowH;
    }
    // Vertical line in Attendance box
    doc.setDrawColor(220, 224, 230);
    doc.line(rightX + 68, grid1Y + 8, rightX + 68, grid1Y + boxH);


    // --- 4. EARNINGS & DEDUCTIONS TABLES ---
    const tableY = 125;
    const tableH = 75;
    const earnRowH = 8.0;
    const totalRowH = 13;

    // LEFT: EARNINGS
    doc.setDrawColor(15, 36, 62);
    doc.rect(10, tableY, boxW, tableH);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(10, tableY, boxW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 12, tableY + 5.5);

    // Subheader row
    doc.setFillColor(221, 235, 247);
    doc.rect(10, tableY + 8, boxW, 6, 'F');
    doc.setTextColor(31, 78, 120);
    doc.text('Particulars', 12, tableY + 12.2);
    doc.text('Amount (Rs)', 100, tableY + 12.2, { align: 'right' });

    const earnings = [
        ['Basic Salary', financials.basic],
        ['House Rent Allowance (HRA)', financials.hra],
        ['Conveyance Allowance', financials.conveyance],
        ['Medical Allowance', financials.medical],
        ['Special Allowance', financials.special],
        ['Other Allowance', financials.otherAllowance]
    ];

    doc.setTextColor(50, 50, 50);
    currY = tableY + 14;
    for (let i = 0; i < earnings.length; i++) {
        doc.setDrawColor(220, 224, 230);
        doc.line(10, currY + earnRowH, 10 + boxW, currY + earnRowH);

        doc.setFont('helvetica', 'normal');
        doc.text(earnings[i][0] as string, 12, currY + 5.5);
        doc.text((earnings[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, currY + 5.5, { align: 'right' });
        currY += earnRowH;
    }

    // Gross Earnings Total Footer
    doc.setFillColor(221, 235, 247);
    doc.rect(10, tableY + 14 + (6 * earnRowH), boxW, totalRowH, 'F');
    doc.setDrawColor(15, 36, 62);
    doc.line(10, tableY + 14 + (6 * earnRowH), 10 + boxW, tableY + 14 + (6 * earnRowH));
    
    doc.setTextColor(31, 78, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('GROSS EARNINGS', 12, tableY + 14 + (6 * earnRowH) + 8);
    doc.text('Rs.', 80, tableY + 14 + (6 * earnRowH) + 8);
    doc.text(financials.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, tableY + 14 + (6 * earnRowH) + 8, { align: 'right' });

    // Vertical line in Earnings table
    doc.setDrawColor(220, 224, 230);
    doc.line(78, tableY + 8, 78, tableY + tableH);


    // RIGHT: DEDUCTIONS
    doc.setDrawColor(15, 36, 62);
    doc.rect(rightX, tableY, boxW, tableH);

    // Header bar
    doc.setFillColor(15, 36, 62);
    doc.rect(rightX, tableY, boxW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS', rightX + 2, tableY + 5.5);

    // Subheader row
    doc.setFillColor(221, 235, 247);
    doc.rect(rightX, tableY + 8, boxW, 6, 'F');
    doc.setTextColor(31, 78, 120);
    doc.text('Particulars', rightX + 2, tableY + 12.2);
    doc.text('Amount (Rs)', rightX + boxW - 2, tableY + 12.2, { align: 'right' });

    const deductions = [
        ['Provident Fund (PF)', financials.pf],
        ['Professional Tax', financials.profTax],
        ['ESI', financials.esi],
        ['Loan / Advance Deduction', financials.loanDeduction],
        ['Other Deductions', financials.otherDeductions],
        ['Loss of Pay (LOP) Deduction', financials.lopDeduction]
    ];

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(7.5);
    currY = tableY + 14;
    for (let i = 0; i < deductions.length; i++) {
        doc.setDrawColor(220, 224, 230);
        doc.line(rightX, currY + earnRowH, rightX + boxW, currY + earnRowH);

        if (deductions[i][0]) {
            doc.setFont('helvetica', 'normal');
            doc.text(deductions[i][0] as string, rightX + 2, currY + 5.5);
            doc.text((deductions[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), rightX + boxW - 2, currY + 5.5, { align: 'right' });
        }
        currY += earnRowH;
    }

    // Deductions Total Footer
    doc.setFillColor(221, 235, 247);
    doc.rect(rightX, tableY + 14 + (6 * earnRowH), boxW, totalRowH, 'F');
    doc.setDrawColor(15, 36, 62);
    doc.line(rightX, tableY + 14 + (6 * earnRowH), rightX + boxW, tableY + 14 + (6 * earnRowH));
    
    doc.setTextColor(31, 78, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TOTAL DEDUCTIONS', rightX + 2, tableY + 14 + (6 * earnRowH) + 8);
    doc.text('Rs.', rightX + 68 + 2, tableY + 14 + (6 * earnRowH) + 8);
    doc.text(financials.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), rightX + boxW - 2, tableY + 14 + (6 * earnRowH) + 8, { align: 'right' });

    // Vertical line in Deductions table
    doc.setDrawColor(220, 224, 230);
    doc.line(rightX + 68, tableY + 8, rightX + 68, tableY + tableH);


    // --- 5. NET SALARY BANNER ---
    const netY = 210;
    const netH = 30;
    doc.setDrawColor(15, 36, 62);
    doc.rect(10, netY, 190, netH);

    // Header
    doc.setFillColor(15, 36, 62);
    doc.rect(10, netY, 190, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('NET SALARY', 105, netY + 5.0, { align: 'center' });

    // Amount
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Rs. ${financials.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 105, netY + 16, { align: 'center' });

    // Divider line inside
    doc.setDrawColor(220, 224, 230);
    doc.line(10, netY + 21, 200, netY + 21);

    // Amount in Words
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Amount in Words', 12, netY + 26.5);
    doc.text(':', 38, netY + 26.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rupees ${numberToWords(financials.netPay)}`, 41, netY + 26.5);


    // --- 6. SIGNATURE / SIGN-OFF AREA ---
    const signY = 248;
    doc.setTextColor(50, 50, 50);
    
    // Left side - Employee Signature
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, signY + 18, 75, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Employee Signature', 45, signY + 22.5, { align: 'center' });

    // Right side - Employer Signatory
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('For FORGE INDIA CONNECT PVT. LTD.', 165, signY + 3.5, { align: 'center' });
    
    doc.line(135, signY + 18, 195, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', 165, signY + 22.5, { align: 'center' });


    // --- 7. FOOTER ---
    const footY = 284;
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('This is a system generated payslip and does not require any signature.', 105, footY, { align: 'center' });

    doc.save(`Payslip_${formattedMonth}_${rawYear}.pdf`);
};
