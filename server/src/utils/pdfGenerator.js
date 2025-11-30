// backend/utils/pdfGenerator.js
// 🔥 PRESCRIPTION PDF GENERATOR

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generatePrescriptionPDF = async (prescription, doctor, center) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      // Collect PDF data in memory
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ═══════════════════════════════════════════════════════
      // HEADER - Doctor & Center Information
      // ═══════════════════════════════════════════════════════
      
      // Logo/Header Box
      doc.rect(50, 50, 495, 120).stroke();
      
      // Center Name
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor('#047857')
         .text(center?.name || 'Ayurvedic Medical Center', 60, 60, { width: 475, align: 'center' });

      // Doctor Details
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text(`Dr. ${doctor.name}`, 60, 95, { width: 475, align: 'center' });

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#475569')
         .text(`${doctor.qualifications?.bams?.degree || 'BAMS'} | Reg. No: ${doctor.registrationNumber || 'N/A'}`, 60, 115, { width: 475, align: 'center' });
      
      doc.text(`${doctor.specializations?.join(', ') || 'Ayurvedic Medicine'}`, 60, 130, { width: 475, align: 'center' });
      
      doc.text(`${center?.address?.street || ''}, ${center?.address?.city || ''}, ${center?.address?.state || ''}`, 60, 145, { width: 475, align: 'center' });
      
      doc.text(`Phone: ${doctor.phone || center?.contactInfo?.phone || 'N/A'} | Email: ${doctor.email || ''}`, 60, 160, { width: 475, align: 'center' });

      // ═══════════════════════════════════════════════════════
      // PRESCRIPTION HEADER
      // ═══════════════════════════════════════════════════════
      
      doc.moveDown(3);
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#0284c7')
         .text('℞ PRESCRIPTION', 50, 200, { align: 'center' });

      doc.moveTo(50, 225).lineTo(545, 225).stroke();

      // ═══════════════════════════════════════════════════════
      // PATIENT & PRESCRIPTION DETAILS
      // ═══════════════════════════════════════════════════════
      
      let yPosition = 240;

      // Left Column
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('Patient Name:', 60, yPosition);
      
      doc.font('Helvetica')
         .text(prescription.patientId?.name || 'N/A', 160, yPosition);

      yPosition += 20;
      doc.font('Helvetica-Bold')
         .text('Age/Gender:', 60, yPosition);
      
      const age = prescription.patientId?.age || 'N/A';
      const gender = prescription.patientId?.gender || 'N/A';
      doc.font('Helvetica')
         .text(`${age} / ${gender}`, 160, yPosition);

      yPosition += 20;
      doc.font('Helvetica-Bold')
         .text('Phone:', 60, yPosition);
      
      doc.font('Helvetica')
         .text(prescription.patientId?.phone || 'N/A', 160, yPosition);

      // Right Column
      yPosition = 240;
      doc.font('Helvetica-Bold')
         .text('Prescription No:', 350, yPosition);
      
      doc.font('Helvetica')
         .text(prescription.prescriptionNumber || 'N/A', 460, yPosition);

      yPosition += 20;
      doc.font('Helvetica-Bold')
         .text('Date:', 350, yPosition);
      
      doc.font('Helvetica')
         .text(new Date(prescription.createdAt).toLocaleDateString('en-IN'), 460, yPosition);

      yPosition += 20;
      doc.font('Helvetica-Bold')
         .text('Follow-up:', 350, yPosition);
      
      doc.font('Helvetica')
         .text(prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString('en-IN') : 'As needed', 460, yPosition);

      yPosition += 35;
      doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();

      // ═══════════════════════════════════════════════════════
      // CHIEF COMPLAINT & DIAGNOSIS
      // ═══════════════════════════════════════════════════════
      
      yPosition += 15;
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#dc2626')
         .text('Chief Complaint:', 60, yPosition);
      
      yPosition += 15;
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#1e293b')
         .text(prescription.chiefComplaint, 60, yPosition, { width: 485 });

      yPosition += Math.ceil(doc.heightOfString(prescription.chiefComplaint, { width: 485 })) + 15;

      if (prescription.diagnosis) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#047857')
           .text('Diagnosis:', 60, yPosition);
        
        yPosition += 15;
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#1e293b')
           .text(prescription.diagnosis, 60, yPosition, { width: 485 });
        
        yPosition += Math.ceil(doc.heightOfString(prescription.diagnosis, { width: 485 })) + 15;
      }

      doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();

      // ═══════════════════════════════════════════════════════
      // MEDICINES TABLE
      // ═══════════════════════════════════════════════════════
      
      yPosition += 20;
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#0284c7')
         .text('💊 MEDICINES', 60, yPosition);

      yPosition += 25;

      // Table Header
      doc.rect(50, yPosition - 5, 495, 25).fillAndStroke('#e0f2fe', '#0284c7');
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('Medicine Name', 60, yPosition + 5, { width: 150 })
         .text('Dosage', 220, yPosition + 5, { width: 80 })
         .text('Frequency', 310, yPosition + 5, { width: 80 })
         .text('Duration', 400, yPosition + 5, { width: 60 })
         .text('Qty', 470, yPosition + 5, { width: 50, align: 'right' });

      yPosition += 30;

      // Medicine Rows
      prescription.medicines.forEach((med, index) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(50, yPosition - 5, 495, 40).fillAndStroke('#f8fafc', '#e2e8f0');
        } else {
          doc.rect(50, yPosition - 5, 495, 40).stroke('#e2e8f0');
        }

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1e293b')
           .text(med.name, 60, yPosition, { width: 150 });
        
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#475569')
           .text(med.genericName || '', 60, yPosition + 12, { width: 150 });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#1e293b')
           .text(med.dosage, 220, yPosition + 5, { width: 80 })
           .text(med.frequency, 310, yPosition + 5, { width: 80 })
           .text(med.duration, 400, yPosition + 5, { width: 60 })
           .text(med.quantity.toString(), 470, yPosition + 5, { width: 50, align: 'right' });

        doc.fontSize(8)
           .fillColor('#64748b')
           .text(med.timing, 310, yPosition + 18, { width: 150 });

        yPosition += 45;
      });

      yPosition += 10;
      doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();

      // ═══════════════════════════════════════════════════════
      // INSTRUCTIONS
      // ═══════════════════════════════════════════════════════
      
      yPosition += 20;

      if (prescription.generalInstructions || prescription.dietInstructions || prescription.lifestyleInstructions) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#0284c7')
           .text('📋 INSTRUCTIONS', 60, yPosition);

        yPosition += 20;

        if (prescription.generalInstructions) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor('#1e293b')
             .text('General Instructions:', 60, yPosition);
          
          yPosition += 12;
          doc.fontSize(9)
             .font('Helvetica')
             .text(prescription.generalInstructions, 60, yPosition, { width: 485 });
          
          yPosition += Math.ceil(doc.heightOfString(prescription.generalInstructions, { width: 485 })) + 12;
        }

        if (prescription.dietInstructions) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor('#1e293b')
             .text('Diet Instructions:', 60, yPosition);
          
          yPosition += 12;
          doc.fontSize(9)
             .font('Helvetica')
             .text(prescription.dietInstructions, 60, yPosition, { width: 485 });
          
          yPosition += Math.ceil(doc.heightOfString(prescription.dietInstructions, { width: 485 })) + 12;
        }

        if (prescription.lifestyleInstructions) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor('#1e293b')
             .text('Lifestyle Instructions:', 60, yPosition);
          
          yPosition += 12;
          doc.fontSize(9)
             .font('Helvetica')
             .text(prescription.lifestyleInstructions, 60, yPosition, { width: 485 });
          
          yPosition += Math.ceil(doc.heightOfString(prescription.lifestyleInstructions, { width: 485 })) + 12;
        }
      }

      // ═══════════════════════════════════════════════════════
      // FOOTER - SIGNATURE & DISCLAIMER
      // ═══════════════════════════════════════════════════════
      
      // Doctor Signature (fixed at bottom)
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text(`Dr. ${doctor.name}`, 400, 720, { align: 'right' });
      
      doc.moveTo(400, 715).lineTo(540, 715).stroke();
      
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#64748b')
         .text('Doctor\'s Signature', 400, 725, { align: 'right' });

      // Disclaimer
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#94a3b8')
         .text('This is a computer-generated prescription and is valid. Please follow the instructions carefully.', 50, 760, { 
           width: 495, 
           align: 'center' 
         });

      doc.text('For any queries, please contact the clinic.', 50, 770, { 
        width: 495, 
        align: 'center' 
      });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};
