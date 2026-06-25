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

const formatTimeTo12Hour = (time?: string) => {
    if (!time || time === '--:--') return '--:--';
    try {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
        return time;
    }
};

const calculateWorkingHours = (checkIn?: string, checkOut?: string, dbWorkHours?: number) => {
    if (!checkIn || !checkOut || checkIn === '--:--' || checkOut === '--:--') {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
    try {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        
        let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMins < 0) diffMins += 24 * 60;
        
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        return `${hrs}h ${mins}m`;
    } catch {
        return dbWorkHours ? `${dbWorkHours.toFixed(1)} hrs` : '--:--';
    }
};

export const generateAttendancePDF = async (employee: any, currentDate: Date, attendanceRecords: any[]) => {
    if (!employee) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();
    const formattedMonth = currentDate.toLocaleString('default', { month: 'long' });

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

    // LEDGER Capsule Box
    doc.setFillColor(15, 36, 62); // Dark Blue #0F243E
    doc.roundedRect(168, 11, 32, 22, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('TIME LEDGER', 184, 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${formattedMonth.substring(0, 3)} ${year}`, 184, 25, { align: 'center' });

    // Separator line
    doc.setDrawColor(15, 36, 62);
    doc.setLineWidth(0.4);
    doc.line(10, 39, 200, 39);

    // --- 2. METADATA SECTION ---
    const empId = employee.employeeId || employee.id || 'N/A';
    const roleMap: Record<string, string> = {
        'admin': 'HR Administrator',
        'subadmin': 'Sub Admin Developer',
        'hr': 'HR Manager',
        'employee': 'Full Stack Developer',
        'staff': 'Office Staff'
    };
    const designation = roleMap[employee.role?.toLowerCase()] || employee.role || 'Full Stack Developer';

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);

    // Left Grid: Employee Info
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Name :', 12, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.name, 38, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Employee ID       :', 12, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(empId, 38, 50);

    doc.setFont('helvetica', 'bold');
    doc.text('Designation        :', 12, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(designation, 38, 55);

    // Right Grid: Statistics Summary
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    // Filter records for this month
    const yearMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthlyAttendance = Array.isArray(attendanceRecords)
        ? attendanceRecords.filter(r => r.date.startsWith(yearMonthStr))
        : [];

    let sundays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
        if (new Date(year, monthIndex, i).getDay() === 0) sundays++;
    }

    const presentCount = monthlyAttendance.filter(r => r.status === 'Present').length;
    const halfDayCount = monthlyAttendance.filter(r => r.status === 'Half Day').length;
    const lateCount = monthlyAttendance.filter(r => r.status === 'Late').length;
    const leavesCount = monthlyAttendance.filter(r => r.status === 'Absent' || r.status === 'Leave').length;

    const effectivePresent = presentCount + (halfDayCount * 0.5);

    // Stats Grid Draw
    doc.setFont('helvetica', 'bold');
    doc.text('Present Days     :', 110, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`${effectivePresent} days`, 136, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Late / Half        :', 110, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${lateCount} L / ${halfDayCount} H`, 136, 50);

    doc.setFont('helvetica', 'bold');
    doc.text('Leaves / Off     :', 110, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${leavesCount} Leaves / ${sundays} Off`, 136, 55);

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(10, 60, 200, 60);

    // --- 3. ATTENDANCE TABLE ---
    const startTableY = 66;
    doc.setFillColor(15, 36, 62);
    doc.rect(10, startTableY, 190, 7.5, 'F');

    // Headers text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Date', 13, startTableY + 5);
    doc.text('Day', 30, startTableY + 5);
    doc.text('Status', 50, startTableY + 5);
    doc.text('Check In', 85, startTableY + 5);
    doc.text('Check Out', 115, startTableY + 5);
    doc.text('Work Hours', 145, startTableY + 5);
    doc.text('Work Mode / Location', 172, startTableY + 5);

    let currentY = startTableY + 7.5;
    const rowHeight = 5.8;

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');

    for (let day = 1; day <= daysInMonth; day++) {
        // Fetch or calculate status
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let record = attendanceRecords.find(r => r.date === dateStr);

        const dayDate = new Date(year, monthIndex, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isWeeklyOff = dayDate.getDay() === 0;

        if (!record) {
            if (isWeeklyOff) {
                record = {
                    date: dateStr,
                    status: 'Leave',
                    isWeeklyOff: true
                };
            } else if (dayDate < today) {
                record = {
                    date: dateStr,
                    status: 'Absent',
                    isSynthetic: true
                };
            }
        }

        // Draw zebra striping
        if (day % 2 === 0) {
            doc.setFillColor(245, 247, 250);
            doc.rect(10, currentY, 190, rowHeight, 'F');
        }

        // Check if page needs wrap
        if (currentY > 275) {
            doc.addPage();
            currentY = 15;
            
            // Header box again
            doc.setFillColor(15, 36, 62);
            doc.rect(10, currentY, 190, 7.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('Date', 13, currentY + 5);
            doc.text('Day', 30, currentY + 5);
            doc.text('Status', 50, currentY + 5);
            doc.text('Check In', 85, currentY + 5);
            doc.text('Check Out', 115, currentY + 5);
            doc.text('Work Hours', 145, currentY + 5);
            doc.text('Work Mode / Location', 172, currentY + 5);

            currentY += 7.5;
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
        }

        // Row contents formatting
        const formattedDate = `${String(day).padStart(2, '0')} ${formattedMonth.substring(0, 3)}`;
        const formattedDay = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        let status = 'Not Marked';
        if (record) {
            if (record.isWeeklyOff) status = 'Weekly Off';
            else status = record.status;
        }

        // Color coding for status
        if (status === 'Present') doc.setTextColor(40, 167, 69);
        else if (status === 'Absent') doc.setTextColor(220, 53, 69);
        else if (status === 'Weekly Off') doc.setTextColor(15, 36, 62);
        else if (status === 'Half Day') doc.setTextColor(255, 193, 7);
        else if (status === 'Late') doc.setTextColor(23, 162, 184);
        else doc.setTextColor(100, 100, 100);

        doc.setFont('helvetica', 'bold');
        doc.text(formattedDate, 13, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(formattedDay, 30, currentY + 4);
        doc.text(status, 50, currentY + 4);

        // Reset to dark grey for timing columns
        doc.setTextColor(70, 70, 70);
        
        const checkInVal = record?.checkIn ? formatTimeTo12Hour(record.checkIn) : '--:--';
        const checkOutVal = record?.checkOut ? formatTimeTo12Hour(record.checkOut) : '--:--';
        const workHoursVal = record && !record.isWeeklyOff && !record.isSynthetic
            ? calculateWorkingHours(record.checkIn, record.checkOut, record.workHours)
            : '--:--';
            
        let modeVal = '--';
        if (record && !record.isWeeklyOff && !record.isSynthetic) {
            const mode = record.workMode === 'Work from Office' ? 'Office' : (record.workMode === 'Work from Home' ? 'Remote' : '');
            const loc = record.workLocation || '';
            modeVal = [mode, loc].filter(Boolean).join(' - ');
        }

        doc.text(checkInVal, 85, currentY + 4);
        doc.text(checkOutVal, 115, currentY + 4);
        doc.text(workHoursVal, 145, currentY + 4);
        doc.text(modeVal.substring(0, 24), 172, currentY + 4); // truncated to fit layout

        // Draw horizontal grid line
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.15);
        doc.line(10, currentY + rowHeight, 200, currentY + rowHeight);

        currentY += rowHeight;
    }

    // Save/Download PDF
    const safeEmpName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Attendance_Ledger_${safeEmpName}_${formattedMonth}_${year}.pdf`);
};
