import jsPDF from 'jspdf';

export interface PayslipFinancials {
    basic: number;
    hra: number;
    special: number;
    conveyance: number;
    medical: number;
    internet: number;
    food: number;
    incentive: number;
    overtime: number;
    bonus: number;
    totalEarnings: number;

    pf: number;
    profTax: number;
    esi: number;
    tds: number;
    loan: number;
    advance: number;
    penalty: number;
    lop: number;
    totalDeductions: number;

    travel: number;
    fuel: number;
    mobile: number;
    foodExp: number;
    totalReimbursements: number;

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
    const scale = netPay / 47650;
    
    // Earnings (Default scaled values)
    let basic = Math.round(18000 * scale);
    let hra = Math.round(7200 * scale);
    let special = Math.round(5000 * scale);
    let conveyance = Math.round(2000 * scale);
    let medical = Math.round(1500 * scale);
    let internet = Math.round(1000 * scale);
    let food = Math.round(1500 * scale);
    let incentive = Math.round(3000 * scale);
    let overtime = Math.round(2500 * scale);
    let bonus = Math.round(5000 * scale);
    
    // Deductions (Default scaled values)
    let pf = Math.round(1800 * scale);
    let profTax = Math.round(200 * scale);
    let esi = Math.round(350 * scale);
    let tds = Math.round(500 * scale);
    let loan = 0;
    let advance = 0;
    let penalty = 0;
    let lop = 0;
    
    // Reimbursements (Default scaled values)
    let travel = Math.round(1500 * scale);
    let fuel = Math.round(2000 * scale);
    let mobile = Math.round(800 * scale);
    let foodExp = Math.round(500 * scale);

    // Override with actual values from database if available
    const dbBase = payroll.base || payroll.basic || employee?.salary?.base || 0;
    const dbHra = payroll.hra || employee?.salary?.hra || 0;
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
        
        const transport = employee?.salary?.transport || 0;
        const other = employee?.salary?.other || 0;
        if (transport > 0) conveyance = transport;
        if (other > 0) special = other;
        
        if (dbBonus > 0) {
            incentive = dbBonus;
        } else {
            incentive = 0;
        }
        
        overtime = 0;
        bonus = 0;
    }

    if (dbPf > 0) pf = dbPf;
    if (dbTax > 0) tds = dbTax;
    
    let totalEarnings = basic + hra + special + conveyance + medical + internet + food + incentive + overtime + bonus;
    let totalDeductions = pf + profTax + esi + tds + loan + advance + penalty + lop;
    let totalReimbursements = travel + fuel + mobile + foodExp;
    
    if (dbDeductions > 0 && dbDeductions !== totalDeductions) {
        const diff = dbDeductions - totalDeductions;
        pf += Math.round(diff * 0.6);
        tds += Math.round(diff * 0.4);
        totalDeductions = pf + profTax + esi + tds + loan + advance + penalty + lop;
    }
    
    let currentNet = totalEarnings - totalDeductions + totalReimbursements;
    let diff = netPay - currentNet;
    
    if (diff !== 0) {
        special += diff;
        totalEarnings += diff;
        if (special < 0) {
            const pullFromSpecial = -special;
            special = 0;
            totalEarnings -= pullFromSpecial;
            
            travel = Math.max(0, travel - Math.round(pullFromSpecial * 0.5));
            fuel = Math.max(0, fuel - Math.round(pullFromSpecial * 0.5));
            totalReimbursements = travel + fuel + mobile + foodExp;
            
            currentNet = totalEarnings - totalDeductions + totalReimbursements;
            diff = netPay - currentNet;
            if (diff !== 0) {
                basic += diff;
                totalEarnings += diff;
            }
        }
    }
    
    return {
        basic, hra, special, conveyance, medical, internet, food, incentive, overtime, bonus,
        totalEarnings,
        pf, profTax, esi, tds, loan, advance, penalty, lop,
        totalDeductions,
        travel, fuel, mobile, foodExp,
        totalReimbursements,
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
    const payDate = `${lastDay}-${formattedMonth.substring(0, 3)}-${rawYear}`;

    // Formatting fields
    const empId = employee.employeeId || employee.id || 'N/A';
    const cleanEmpIdNumeric = empId.replace(/\D/g, '').padStart(6, '0');
    const payslipNo = `FIC/PS/${rawYear}/${cleanEmpIdNumeric}`;
    
    // Financial Breakdown
    const financials = computeFinancials(employee, payroll);

    // --- 1. HEADER SECTION ---
    // Hexagon Logo
    const hexX = 12;
    const hexY = 12;
    doc.setFillColor(11, 59, 96); // #0B3B60
    // Hexagon via triangles
    doc.triangle(hexX + 3, hexY, hexX + 9, hexY, hexX + 3, hexY + 10, 'F');
    doc.triangle(hexX + 9, hexY, hexX + 9, hexY + 10, hexX + 3, hexY + 10, 'F');
    doc.triangle(hexX, hexY + 5, hexX + 3, hexY, hexX + 3, hexY + 10, 'F');
    doc.triangle(hexX + 12, hexY + 5, hexX + 9, hexY, hexX + 9, hexY + 10, 'F');
    // Inner Logo Lines
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.line(hexX + 3, hexY + 3, hexX + 9, hexY + 3);
    doc.line(hexX + 3, hexY + 3, hexX + 3, hexY + 7);
    doc.line(hexX + 3, hexY + 7, hexX + 7, hexY + 7);
    doc.line(hexX + 7, hexY + 5, hexX + 7, hexY + 7);

    // Organization Text
    doc.setTextColor(11, 59, 96);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FORGE INDIA CONNECT PVT. LTD.', 27, 16);
    
    doc.setTextColor(85, 85, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('IT Services | HR Consultancy | Business Solutions', 27, 20.5);
    
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(6.5);
    doc.text('No.12, 2nd Floor, OPP. Old Bus Stand, Hosur Road, Krishnagiri - 635001, Tamil Nadu, India.', 27, 25.5);
    
    // Icon symbols representation
    doc.text('+91 93634 56789    |    info@forgeindiaconnect.com    |    www.forgeindiaconnect.com', 27, 30.5);

    // Capsule title
    doc.setFillColor(11, 59, 96);
    doc.roundedRect(142, 12, 58, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('EMPLOYEE PAYSLIP', 171, 16.5, { align: 'center' });

    // Metadata Right-side Table
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const metaY = 23;
    const metaHeight = 4.5;
    
    doc.text('Payslip No.', 142, metaY);
    doc.text('Month', 142, metaY + metaHeight);
    doc.text('Pay Date', 142, metaY + (metaHeight * 2));
    
    doc.text(':', 160, metaY);
    doc.text(':', 160, metaY + metaHeight);
    doc.text(':', 160, metaY + (metaHeight * 2));

    doc.setFont('helvetica', 'bold');
    doc.text(payslipNo, 163, metaY);
    doc.text(`${formattedMonth} ${rawYear}`, 163, metaY + metaHeight);
    doc.text(payDate, 163, metaY + (metaHeight * 2));

    // Separator line
    doc.setFillColor(11, 59, 96);
    doc.rect(10, 36.5, 190, 1.2, 'F');

    // --- 2. EMPLOYEE INFORMATION SECTION ---
    const infoY = 41;
    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(0.2);
    doc.rect(10, infoY, 190, 42);

    // Initial Avatar
    const avatarX = 26;
    const avatarY = 62;
    doc.setFillColor(240, 244, 248);
    doc.circle(avatarX, avatarY, 12, 'F');
    doc.setDrawColor(11, 59, 96);
    doc.setLineWidth(0.4);
    doc.circle(avatarX, avatarY, 12, 'S');

    // Initials Text
    const nameParts = employee.name.split(' ');
    const initials = nameParts.map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(11, 59, 96);
    doc.text(initials, avatarX, avatarY + 4.5, { align: 'center' });

    // Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('EMPLOYEE INFORMATION', 42, infoY + 5);

    // Detailed Info
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    const infoCol1X = 42;
    const infoCol2X = 118;
    const rowYStart = infoY + 10;
    const infoRowHeight = 4.2;

    const roleMap: Record<string, string> = {
        'admin': 'HR Administrator',
        'subadmin': 'Sub Admin Developer',
        'hr': 'HR Manager',
        'employee': 'Full Stack Developer',
        'staff': 'Office Staff'
    };
    const designation = roleMap[employee.role?.toLowerCase()] || employee.role || 'Full Stack Developer';

    const col1Data = [
        ['Employee ID', empId],
        ['Employee Name', employee.name],
        ['Designation', designation],
        ['Department', employee.department || 'IT Development'],
        ['Branch', employee.branchName || 'Krishnagiri'],
        ['Date of Joining', employee.joiningDate || '21-Jan-2026'],
        ['Employment Type', 'Permanent']
    ];

    const generatePAN = (name: string, id: string) => {
        const letters = 'ABCDE';
        const nameChar = name.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'P';
        const numPart = id.replace(/\D/g, '').padEnd(4, '0').substring(0, 4);
        return `${letters}${numPart}${nameChar}`;
    };

    const panVal = generatePAN(employee.name, empId);
    const uanVal = '101' + cleanEmpIdNumeric.padEnd(9, '2');
    const pfVal = 'TNKRK' + cleanEmpIdNumeric.padEnd(10, '3');
    const esiVal = '12' + cleanEmpIdNumeric.padEnd(8, '4');
    const bankAcc = '388' + cleanEmpIdNumeric.padEnd(8, '5');

    const col2Data = [
        ['PAN Number', panVal],
        ['UAN Number', uanVal],
        ['PF Number', pfVal],
        ['ESI Number', esiVal],
        ['Bank Name', 'State Bank of India'],
        ['Bank Account No.', bankAcc],
        ['IFSC Code', 'SBIN0001234']
    ];

    for (let i = 0; i < col1Data.length; i++) {
        const currY = rowYStart + (i * infoRowHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(col1Data[i][0], infoCol1X, currY);
        doc.text(':', infoCol1X + 24, currY);
        doc.setFont('helvetica', 'bold');
        doc.text(String(col1Data[i][1] || ''), infoCol1X + 26, currY);

        doc.setFont('helvetica', 'normal');
        doc.text(col2Data[i][0], infoCol2X, currY);
        doc.text(':', infoCol2X + 26, currY);
        doc.setFont('helvetica', 'bold');
        doc.text(String(col2Data[i][1] || ''), infoCol2X + 28, currY);
    }

    // --- 3. FINANCIAL TABLES SECTION ---
    let tableY = 87;
    const tableW = 92;
    const headerH = 6;
    const rowH = 4.8;

    // LEFT COLUMN: EARNINGS
    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(0.2);
    // Table box: Y=87, height = 6 (header) + 10 * 4.8 (rows) + 6 (total) = 60
    doc.rect(10, tableY, tableW, 60);

    // Earnings Header Background
    doc.setFillColor(226, 240, 217); // #E2F0D9
    doc.rect(10, tableY, tableW, headerH, 'F');
    // Header text
    doc.setTextColor(56, 87, 35); // #385723
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('EARNINGS', 12, tableY + 4.2);
    doc.text('AMOUNT (₹)', 100, tableY + 4.2, { align: 'right' });

    // Earnings rows
    const earnings = [
        ['Basic Salary', financials.basic],
        ['House Rent Allowance (HRA)', financials.hra],
        ['Special Allowance', financials.special],
        ['Conveyance Allowance', financials.conveyance],
        ['Medical Allowance', financials.medical],
        ['Internet Allowance', financials.internet],
        ['Food Allowance', financials.food],
        ['Performance Incentive', financials.incentive],
        ['Overtime', financials.overtime],
        ['Bonus', financials.bonus]
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    let currRowY = tableY + headerH;
    for (let i = 0; i < earnings.length; i++) {
        doc.setDrawColor(240, 244, 248);
        doc.line(10, currRowY + rowH, 10 + tableW, currRowY + rowH);
        
        doc.text(earnings[i][0] as string, 12, currRowY + 3.5);
        doc.text((earnings[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, currRowY + 3.5, { align: 'right' });
        currRowY += rowH;
    }

    // Earnings Total Footer
    doc.setFillColor(226, 240, 217);
    doc.rect(10, tableY + headerH + (10 * rowH), tableW, 6, 'F');
    doc.setDrawColor(220, 224, 230);
    doc.line(10, tableY + headerH + (10 * rowH), 10 + tableW, tableY + headerH + (10 * rowH));
    doc.setTextColor(56, 87, 35);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL EARNINGS', 12, tableY + headerH + (10 * rowH) + 4.2);
    doc.text(financials.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, tableY + headerH + (10 * rowH) + 4.2, { align: 'right' });
    
    // Vertical line in Earnings table
    doc.setDrawColor(220, 224, 230);
    doc.line(78, tableY, 78, tableY + 60);


    // RIGHT COLUMN: DEDUCTIONS
    const col2X = 108;
    // Table box: Y=87, height = 6 (header) + 10 * 4.8 (rows) + 6 (total) = 60
    doc.setDrawColor(220, 224, 230);
    doc.rect(col2X, tableY, tableW, 60);

    // Deductions Header Background
    doc.setFillColor(252, 228, 214); // #FCE4D6
    doc.rect(col2X, tableY, tableW, headerH, 'F');
    // Header text
    doc.setTextColor(198, 89, 17); // #C65911
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS', col2X + 2, tableY + 4.2);
    doc.text('AMOUNT (₹)', col2X + tableW - 2, tableY + 4.2, { align: 'right' });

    // Deductions rows
    const deductions = [
        ['Provident Fund (PF)', financials.pf],
        ['Professional Tax', financials.profTax],
        ['ESI', financials.esi],
        ['TDS', financials.tds],
        ['Loan Recovery', financials.loan],
        ['Salary Advance', financials.advance],
        ['Penalty', financials.penalty],
        ['LOP Deduction', financials.lop],
        ['', 0], 
        ['', 0]  
    ];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    currRowY = tableY + headerH;
    for (let i = 0; i < deductions.length; i++) {
        doc.setDrawColor(240, 244, 248);
        doc.line(col2X, currRowY + rowH, col2X + tableW, currRowY + rowH);
        
        if (deductions[i][0]) {
            doc.text(deductions[i][0] as string, col2X + 2, currRowY + 3.5);
            doc.text((deductions[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), col2X + tableW - 2, currRowY + 3.5, { align: 'right' });
        }
        currRowY += rowH;
    }

    // Deductions Total Footer
    doc.setFillColor(252, 228, 214);
    doc.rect(col2X, tableY + headerH + (10 * rowH), tableW, 6, 'F');
    doc.setDrawColor(220, 224, 230);
    doc.line(col2X, tableY + headerH + (10 * rowH), col2X + tableW, tableY + headerH + (10 * rowH));
    doc.setTextColor(198, 89, 17);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DEDUCTIONS', col2X + 2, tableY + headerH + (10 * rowH) + 4.2);
    doc.text(financials.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), col2X + tableW - 2, tableY + headerH + (10 * rowH) + 4.2, { align: 'right' });

    // Vertical line in Deductions table
    doc.setDrawColor(220, 224, 230);
    doc.line(col2X + 68, tableY, col2X + 68, tableY + 60);


    // --- 4. REIMBURSEMENTS & NET PAY SUMMARY ---
    let sec2Y = 151;
    
    // LEFT: REIMBURSEMENTS
    doc.setDrawColor(220, 224, 230);
    doc.rect(10, sec2Y, tableW, 31.2);

    // Header Background
    doc.setFillColor(221, 235, 247); // #DDEBF7
    doc.rect(10, sec2Y, tableW, headerH, 'F');
    // Text
    doc.setTextColor(31, 78, 120); // #1F4E78
    doc.setFont('helvetica', 'bold');
    doc.text('REIMBURSEMENTS', 12, sec2Y + 4.2);
    doc.text('AMOUNT (₹)', 100, sec2Y + 4.2, { align: 'right' });

    // Rows
    const reimbursements = [
        ['Travel', financials.travel],
        ['Fuel', financials.fuel],
        ['Mobile Bill', financials.mobile],
        ['Food Expenses', financials.foodExp]
    ];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    currRowY = sec2Y + headerH;
    for (let i = 0; i < reimbursements.length; i++) {
        doc.setDrawColor(240, 244, 248);
        doc.line(10, currRowY + rowH, 10 + tableW, currRowY + rowH);
        
        doc.text(reimbursements[i][0] as string, 12, currRowY + 3.5);
        doc.text((reimbursements[i][1] as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, currRowY + 3.5, { align: 'right' });
        currRowY += rowH;
    }

    // Total Footer
    doc.setFillColor(221, 235, 247);
    doc.rect(10, sec2Y + headerH + (4 * rowH), tableW, 6, 'F');
    doc.setDrawColor(220, 224, 230);
    doc.line(10, sec2Y + headerH + (4 * rowH), 10 + tableW, sec2Y + headerH + (4 * rowH));
    doc.setTextColor(31, 78, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL REIMBURSEMENTS', 12, sec2Y + headerH + (4 * rowH) + 4.2);
    doc.text(financials.totalReimbursements.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 100, sec2Y + headerH + (4 * rowH) + 4.2, { align: 'right' });

    // Vertical line in Reimbursements table
    doc.setDrawColor(220, 224, 230);
    doc.line(78, sec2Y, 78, sec2Y + 31.2);


    // RIGHT: NET PAY SUMMARY
    doc.setDrawColor(220, 224, 230);
    doc.rect(col2X, sec2Y, tableW, 35.2);

    // Header Background
    doc.setFillColor(15, 36, 62); // Dark Blue #0F243E
    doc.rect(col2X, sec2Y, tableW, headerH, 'F');
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAY SUMMARY', col2X + 2, sec2Y + 4.2);

    // Values
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    const netYStart = sec2Y + 11;
    const netRowH = 4.8;
    
    doc.text('Gross Earnings', col2X + 2, netYStart);
    doc.text(financials.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), col2X + tableW - 2, netYStart, { align: 'right' });
    
    doc.text('Total Deductions', col2X + 2, netYStart + netRowH);
    doc.setTextColor(198, 89, 17); 
    doc.text(`(-) ${financials.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col2X + tableW - 2, netYStart + netRowH, { align: 'right' });
    
    doc.setTextColor(50, 50, 50);
    doc.text('Total Reimbursements', col2X + 2, netYStart + (netRowH * 2));
    doc.setTextColor(56, 87, 35); 
    doc.text(`(+) ${financials.totalReimbursements.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col2X + tableW - 2, netYStart + (netRowH * 2), { align: 'right' });

    // Double divider
    doc.setDrawColor(220, 224, 230);
    doc.line(col2X, netYStart + (netRowH * 2) + 2, col2X + tableW, netYStart + (netRowH * 2) + 2);

    // Net Pay Highlight
    const netHighlightY = netYStart + (netRowH * 3) + 2.5;
    doc.setTextColor(11, 59, 96);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NET PAY', col2X + 2, netHighlightY);
    doc.setFontSize(12);
    doc.text(`₹ ${financials.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col2X + tableW - 2, netHighlightY, { align: 'right' });

    // In Words
    doc.setTextColor(11, 59, 96);
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(6.5);
    const inWordsText = `(in words) ${numberToWords(financials.netPay)}`;
    doc.text(inWordsText, col2X + 2, netHighlightY + 4.5);


    // --- 5. BOTTOM SECTION BLOCKS ---
    let bottomY = 191;

    // LEFT: ATTENDANCE SUMMARY
    doc.setDrawColor(220, 224, 230);
    doc.rect(10, bottomY, 92, 17.5);
    
    // Header
    doc.setFillColor(15, 36, 62);
    doc.rect(10, bottomY, 92, 4.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ATTENDANCE SUMMARY', 12, bottomY + 3.2);

    // Grid lines & Text
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    let attRowY = bottomY + 8;
    
    doc.text('Total Working Days', 12, attRowY);
    doc.text(':', 38, attRowY);
    doc.setFont('helvetica', 'bold');
    doc.text('30', 40, attRowY);
    doc.setFont('helvetica', 'normal');
    doc.text('Present Days', 55, attRowY);
    doc.text(':', 78, attRowY);
    doc.setFont('helvetica', 'bold');
    doc.text('29', 80, attRowY);

    doc.setFont('helvetica', 'normal');
    doc.text('Leave Days', 12, attRowY + 4);
    doc.text(':', 38, attRowY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('1', 40, attRowY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('LOP Days', 55, attRowY + 4);
    doc.text(':', 78, attRowY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('0', 80, attRowY + 4);

    doc.setFont('helvetica', 'normal');
    doc.text('Weekly Offs', 12, attRowY + 8);
    doc.text(':', 38, attRowY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text('4', 40, attRowY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text('Holidays', 55, attRowY + 8);
    doc.text(':', 78, attRowY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text('2', 80, attRowY + 8);


    // RIGHT: LEAVE BALANCE
    doc.setDrawColor(220, 224, 230);
    doc.rect(col2X, bottomY, 92, 17.5);

    // Header
    doc.setFillColor(15, 36, 62);
    doc.rect(col2X, bottomY, 92, 4.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('LEAVE BALANCE', col2X + 2, bottomY + 3.2);

    // Leaves Grid
    doc.setFontSize(6.5);
    doc.setTextColor(50, 50, 50);
    
    doc.text('Leave Type', col2X + 2, bottomY + 7.5);
    doc.text('Opening Balance', col2X + 34, bottomY + 7.5);
    doc.text('Taken', col2X + 66, bottomY + 7.5);
    doc.text('Closing Balance', col2X + 90, bottomY + 7.5, { align: 'right' });
    
    doc.line(col2X, bottomY + 8.5, col2X + tableW, bottomY + 8.5);

    const sickBal = employee.leaveBalance?.sick || 4;
    const casualBal = employee.leaveBalance?.casual || 5;
    const earnedBal = employee.leaveBalance?.earned || 10;

    const leaveRows = [
        ['Casual Leave (CL)', casualBal + 1, 1, casualBal],
        ['Sick Leave (SL)', sickBal + 1, 1, sickBal],
        ['Earned Leave (EL)', earnedBal + 2, 2, earnedBal]
    ];

    let leaveY = bottomY + 11.5;
    for (let i = 0; i < leaveRows.length; i++) {
        doc.setFont('helvetica', 'normal');
        doc.text(leaveRows[i][0] as string, col2X + 2, leaveY);
        doc.setFont('helvetica', 'bold');
        doc.text(String(leaveRows[i][1]), col2X + 44, leaveY);
        doc.text(String(leaveRows[i][2]), col2X + 70, leaveY);
        doc.text(String(leaveRows[i][3]), col2X + 90, leaveY, { align: 'right' });
        leaveY += 3.5;
    }


    // --- 6. LOWER BLOCKS ---
    const lowY = 212;

    // COLUMN 1: QR CODE BLOCK (Width 54)
    doc.setDrawColor(220, 224, 230);
    doc.rect(10, lowY, 54, 30);

    // Procedural Vector QR Code
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(12, lowY + 2, 16, 16, 'S');
    
    doc.setFillColor(0, 0, 0);
    doc.rect(13, lowY + 3, 4, 4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(13.8, lowY + 3.8, 2.4, 2.4, 'F');
    doc.setFillColor(0, 0, 0);
    doc.rect(14.5, lowY + 4.5, 1, 1, 'F');

    doc.setFillColor(0, 0, 0);
    doc.rect(23, lowY + 3, 4, 4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(23.8, lowY + 3.8, 2.4, 2.4, 'F');
    doc.setFillColor(0, 0, 0);
    doc.rect(24.5, lowY + 4.5, 1, 1, 'F');

    doc.setFillColor(0, 0, 0);
    doc.rect(13, lowY + 13, 4, 4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(13.8, lowY + 13.8, 2.4, 2.4, 'F');
    doc.setFillColor(0, 0, 0);
    doc.rect(14.5, lowY + 14.5, 1, 1, 'F');

    doc.setFillColor(0, 0, 0);
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
            if ((r < 5 && c < 5) || (r < 5 && c > 7) || (r > 7 && c < 5)) continue;
            if (Math.random() > 0.45) {
                doc.rect(13 + c * 1.15, lowY + 3 + r * 1.15, 1.15, 1.15, 'F');
            }
        }
    }

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Scan to verify payslip', 30, lowY + 4);
    doc.text('or visit', 30, lowY + 6.5);
    doc.setTextColor(11, 59, 96);
    doc.setFont('helvetica', 'bold');
    doc.text('www.forgeindiaconnect.com/verify', 30, lowY + 9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text('Enter Payslip No. and', 30, lowY + 12);
    doc.text('Employee ID.', 30, lowY + 14.5);


    // COLUMN 2: EMPLOYER CONTRIBUTION (Width 68)
    const col3X = 68;
    doc.setDrawColor(220, 224, 230);
    doc.rect(col3X, lowY, 68, 30);

    // Header
    doc.setFillColor(112, 48, 160); // Purple #7030A0
    doc.rect(col3X, lowY, 68, 4.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('EMPLOYER CONTRIBUTION (Company Share)', col3X + 2, lowY + 3.2);

    // Content rows
    const empPF = Math.round(financials.pf * 1.0) || 1800;
    const empESI = Math.round(financials.esi * 1.0) || 350;
    const empTotal = empPF + empESI;

    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text('Employer PF', col3X + 2, lowY + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(empPF.toLocaleString('en-IN', { minimumFractionDigits: 2 }), col3X + 66, lowY + 9.5, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Employer ESI', col3X + 2, lowY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(empESI.toLocaleString('en-IN', { minimumFractionDigits: 2 }), col3X + 66, lowY + 15, { align: 'right' });

    // Total footer
    doc.setFillColor(242, 236, 247); 
    doc.rect(col3X, lowY + 20, 68, 10, 'F');
    doc.setDrawColor(220, 224, 230);
    doc.line(col3X, lowY + 20, col3X + 68, lowY + 20);

    doc.setTextColor(112, 48, 160);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', col3X + 2, lowY + 26);
    doc.text(empTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }), col3X + 66, lowY + 26, { align: 'right' });


    // COLUMN 3: AUTHORIZED SIGNATORY (Width 58)
    const col4X = 140;
    doc.setDrawColor(220, 224, 230);
    doc.rect(col4X, lowY, 60, 30);

    // Signature path vector
    doc.setDrawColor(11, 59, 96);
    doc.setLineWidth(0.4);
    doc.line(col4X + 12, lowY + 16, col4X + 15, lowY + 8);
    doc.line(col4X + 15, lowY + 8, col4X + 20, lowY + 18);
    doc.line(col4X + 20, lowY + 18, col4X + 25, lowY + 6);
    doc.line(col4X + 25, lowY + 6, col4X + 32, lowY + 20);
    doc.line(col4X + 32, lowY + 20, col4X + 48, lowY + 11);
    doc.line(col4X + 8, lowY + 14, col4X + 52, lowY + 14); 

    // Signatory texts
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Authorized Signatory', col4X + 30, lowY + 23.5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('For Forge India Connect Pvt. Ltd.', col4X + 30, lowY + 27, { align: 'center' });


    // --- 7. COMPUTER GENERATED FOOTER BANNER ---
    doc.setFillColor(221, 235, 247); 
    doc.rect(10, 248, 190, 8, 'F');
    doc.setDrawColor(180, 205, 230);
    doc.rect(10, 248, 190, 8, 'S');

    // Info Icon circle
    doc.setFillColor(11, 59, 96);
    doc.circle(13.5, 252, 1.8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(5.5);
    doc.text('i', 13.5, 253.8, { align: 'center' });

    // Banner Text
    doc.setTextColor(11, 59, 96);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('This is a computer generated payslip and does not require any signature.', 17, 253.2);

    doc.save(`Payslip_${formattedMonth}_${rawYear}.pdf`);
};
