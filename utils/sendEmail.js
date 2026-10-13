const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

// Helper to get configured transporter
const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  if (!smtpPass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

// Replace placeholders like {clientName} in templates
const replacePlaceholders = (text, data = {}) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
};

// Luxury Branded Email Wrapper
const wrapEmailHtml = ({ heading = '', bodyHtml = '', ctaText = '', ctaUrl = '', footerNote = '' }) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; border: 1.5px solid #d4af37; border-radius: 12px; max-width: 600px; background-color: #ffffff; color: #1e293b; margin: 0 auto; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
          VISHWAKARMA BUILD & FURNISH
        </h1>
        <p style="margin: 4px 0 0 0; color: #b45309; font-weight: 700; font-size: 12px; text-transform: uppercase;">
          From Foundation to Furniture • Construction & Interior Experts
        </p>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">
          Helpline: +91 9416856468 | Website: vishwakarmabuildandfurnish.in
        </p>
      </div>

      ${heading ? `
      <!-- Heading Banner -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0f172a; font-size: 18px; margin: 0; font-weight: 800;">
          ${heading}
        </h2>
      </div>
      ` : ''}

      <!-- Body Content -->
      <div style="margin-bottom: 24px; line-height: 1.6;">
        ${bodyHtml}
      </div>

      ${ctaText && ctaUrl ? `
      <!-- Dual/Single Action Button -->
      <div style="text-align: center; margin: 26px 0 20px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b45309 100%); color: #ffffff; padding: 13px 28px; border-radius: 8px; font-weight: 800; font-size: 14.5px; text-decoration: none; box-shadow: 0 4px 14px rgba(212,175,55,0.4); letter-spacing: 0.3px;">
          ${ctaText}
        </a>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8; text-align: center; line-height: 1.5;">
        <p style="margin: 0; font-weight: 600; color: #64748b;">
          ${footerNote || 'Vishwakarma Build & Furnish • From Foundation to Furniture'}
        </p>
        <p style="margin: 4px 0 0 0;">
          Charkhi Dadri, Haryana | Customer Helpline: +91 9416856468
        </p>
      </div>
    </div>
  `;
};

// ==========================================
// 1. SITE MEDIA UPDATE EMAIL (Report Aa Gayi Hai)
// ==========================================
const sendSiteMediaUpdateEmail = async ({ client, mediaItems = [], stepTitle = '', updateTitle = '', caption = '' }) => {
  try {
    if (!client?.email) {
      console.log('ℹ️ Client has no email. Skipping site media report email.');
      return false;
    }

    const template = await EmailTemplate.getOrSeedTemplate('SITE_MEDIA_UPDATE');
    if (!template || !template.isEnabled) {
      console.log('ℹ️ Site media update email is disabled in Admin Settings. Skipping.');
      return false;
    }

    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    if (!transporter) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping email notification.');
      return false;
    }

    const portalUrl = process.env.CLIENT_PORTAL_URL || 'https://vishwakarmabuildandfurnish.in/loginuser';
    const appUrl = process.env.APP_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.vishwakarmaapp';

    const count = mediaItems.length || 1;
    const hasVideo = mediaItems.some(m => m.mediaType === 'video');
    const hasImage = mediaItems.some(m => m.mediaType === 'image');
    let mediaTypeLabel = 'Photo';
    if (hasVideo && hasImage) mediaTypeLabel = 'Photos & Videos';
    else if (hasVideo) mediaTypeLabel = count > 1 ? 'Videos' : 'Video';
    else mediaTypeLabel = count > 1 ? 'Photos' : 'Photo';

    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const data = {
      clientName: client.name || 'Client',
      projectName: client.name || 'Site Project',
      siteLocation: client.location || 'Site',
      mediaCount: count,
      mediaType: mediaTypeLabel,
      updateTitle: updateTitle || (mediaItems[0]?.title || 'Daily Site Progress Update'),
      stepTitle: stepTitle || (mediaItems[0]?.stepTitle || 'General Site Work'),
      caption: caption || (mediaItems[0]?.caption || ''),
      date: formattedDate,
      portalUrl,
      appUrl,
      companyName: 'Vishwakarma Build & Furnish',
      helpline: '+91 9416856468'
    };

    const subject = replacePlaceholders(template.subject, data);
    const heading = replacePlaceholders(template.heading, data);
    const bodyHtml = replacePlaceholders(template.body, data);
    const ctaText = replacePlaceholders(template.ctaText, data);
    const ctaUrl = replacePlaceholders(template.ctaUrl, data);
    const footerNote = replacePlaceholders(template.footerNote, data);

    const fullHtml = wrapEmailHtml({
      heading,
      bodyHtml,
      ctaText,
      ctaUrl,
      footerNote
    });

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: client.email,
      subject,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Site media report email sent successfully:', info.messageId, 'to:', client.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending site media report email:', error);
    return false;
  }
};

// ==========================================
// 2. PAYMENT RECEIPT EMAIL
// ==========================================
const sendPaymentReceiptEmail = async ({ client, payment, totalPaid, remainingBalance }) => {
  try {
    if (!client?.email) {
      console.log('ℹ️ Client has no email. Skipping payment receipt email.');
      return false;
    }

    const template = await EmailTemplate.getOrSeedTemplate('PAYMENT_RECEIPT');
    if (!template || !template.isEnabled) {
      console.log('ℹ️ Payment receipt email is disabled in Admin Settings. Skipping.');
      return false;
    }

    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    if (!transporter) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping payment receipt email.');
      return false;
    }

    const formattedDate = new Date(payment.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const portalUrl = process.env.CLIENT_PORTAL_URL || 'https://vishwakarmabuildandfurnish.in/loginuser';

    const data = {
      clientName: client.name || 'Client',
      amount: Number(payment.amount || 0).toLocaleString('en-IN'),
      paymentDate: formattedDate,
      paymentMode: payment.paymentMode || 'Cash',
      receiptNo: payment.receiptNo || 'REC-N/A',
      transactionRef: payment.transactionRef || '',
      stepTitle: payment.stepTitle || 'General',
      totalPaid: Number(totalPaid || 0).toLocaleString('en-IN'),
      remainingBalance: Number(remainingBalance || 0).toLocaleString('en-IN'),
      contractAmount: Number(client.contractAmount || 0).toLocaleString('en-IN'),
      portalUrl,
      helpline: '+91 9416856468'
    };

    const subject = replacePlaceholders(template.subject, data);
    const heading = replacePlaceholders(template.heading, data);
    const bodyHtml = replacePlaceholders(template.body, data);
    const ctaText = replacePlaceholders(template.ctaText, data);
    const ctaUrl = replacePlaceholders(template.ctaUrl, data);
    const footerNote = replacePlaceholders(template.footerNote, data);

    const fullHtml = wrapEmailHtml({
      heading,
      bodyHtml,
      ctaText,
      ctaUrl,
      footerNote
    });

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: client.email,
      subject,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment receipt email sent successfully:', info.messageId, 'to:', client.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending payment receipt email:', error);
    return false;
  }
};

// ==========================================
// 3. CLIENT WELCOME & CREDENTIALS EMAIL
// ==========================================
const sendClientWelcomeEmail = async ({ client, loginPassword, appDownloadUrl }) => {
  try {
    if (!client?.email) {
      console.log('ℹ️ Client has no email. Skipping welcome credentials email.');
      return false;
    }

    const template = await EmailTemplate.getOrSeedTemplate('CLIENT_WELCOME');
    if (!template || !template.isEnabled) {
      console.log('ℹ️ Client welcome email is disabled in Admin Settings. Skipping.');
      return false;
    }

    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    if (!transporter) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping welcome email notification.');
      return false;
    }

    const appUrl = appDownloadUrl || process.env.APP_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.vishwakarmaapp';
    const portalUrl = process.env.CLIENT_PORTAL_URL || 'https://vishwakarmabuildandfurnish.in/loginuser';

    const data = {
      clientName: client.name || 'Client',
      clientEmail: client.email || '',
      loginPassword: loginPassword || '',
      siteLocation: client.location || '',
      contractAmount: Number(client.contractAmount || 0).toLocaleString('en-IN'),
      appUrl,
      portalUrl,
      helpline: '+91 9416856468'
    };

    const subject = replacePlaceholders(template.subject, data);
    const heading = replacePlaceholders(template.heading, data);
    const bodyHtml = replacePlaceholders(template.body, data);
    const ctaText = replacePlaceholders(template.ctaText, data);
    const ctaUrl = replacePlaceholders(template.ctaUrl, data);
    const footerNote = replacePlaceholders(template.footerNote, data);

    const fullHtml = wrapEmailHtml({
      heading,
      bodyHtml,
      ctaText,
      ctaUrl,
      footerNote
    });

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: client.email,
      subject,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Client welcome credentials email sent successfully:', info.messageId, 'to:', client.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending client welcome email:', error);
    return false;
  }
};

// ==========================================
// 4. WEBSITE INQUIRY LEAD EMAIL
// ==========================================
const sendInquiryEmail = async (inquiry) => {
  try {
    const template = await EmailTemplate.getOrSeedTemplate('NEW_INQUIRY');
    if (!template || !template.isEnabled) {
      console.log('ℹ️ New inquiry email notification is disabled in Admin Settings. Skipping.');
      return false;
    }

    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    const toEmail = process.env.NOTIFICATION_EMAIL || 'vishwakarmabuildandfurnish@gmail.com';

    if (!transporter) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping inquiry email notification.');
      return false;
    }

    const data = {
      customerName: inquiry.customerName || 'Customer',
      phone: inquiry.phone || '',
      email: inquiry.email || 'Not provided',
      serviceName: inquiry.serviceName || 'General Quote',
      categoryName: inquiry.categoryName || 'General',
      address: inquiry.address || 'Not provided',
      message: inquiry.message || 'No message provided'
    };

    const subject = replacePlaceholders(template.subject, data);
    const heading = replacePlaceholders(template.heading, data);
    const bodyHtml = replacePlaceholders(template.body, data);
    const ctaText = replacePlaceholders(template.ctaText, data);
    const ctaUrl = replacePlaceholders(template.ctaUrl, data);
    const footerNote = replacePlaceholders(template.footerNote, data);

    const fullHtml = wrapEmailHtml({
      heading,
      bodyHtml,
      ctaText,
      ctaUrl,
      footerNote
    });

    const mailOptions = {
      from: `"Vishwakarma Leads" <${smtpUser}>`,
      to: toEmail,
      subject,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ New lead inquiry email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending inquiry email:', error);
    return false;
  }
};

// ==========================================
// 5. OTP VERIFICATION EMAIL
// ==========================================
const sendOtpEmail = async ({ toEmail, otp, purpose }) => {
  try {
    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    if (!transporter || !toEmail) return false;

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: toEmail,
      subject: `Your Verification OTP Code: ${otp} - Vishwakarma Build & Furnish`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 8px; max-width: 500px; color: #1e293b; margin: 0 auto;">
          <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">Vishwakarma Build & Furnish</h2>
          <p style="font-size: 14px;">Namaste,</p>
          <p style="font-size: 14px;">Aapka verification OTP code hai:</p>
          <div style="background-color: #fefce8; border: 2px dashed #d4af37; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #b45309;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">Yeh OTP agle 10 minute tak valid hai. Kripya is code ko kisi ke sath share na karein.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    return true;
  } catch (err) {
    console.error('❌ Error sending OTP email:', err);
    return false;
  }
};

// ==========================================
// 6. SEND TEST TEMPLATE EMAIL (For Admin Preview & Testing)
// ==========================================
const sendTestTemplateEmail = async ({ key, toEmail, overrideTemplate = null }) => {
  try {
    const template = overrideTemplate || (await EmailTemplate.getOrSeedTemplate(key));
    if (!template) {
      throw new Error(`Template not found for key: ${key}`);
    }

    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    if (!transporter) {
      throw new Error('SMTP credentials are not configured in backend .env');
    }

    // Comprehensive sample data for all variables
    const sampleData = {
      clientName: 'Rajesh Sharma (Sample Client)',
      projectName: 'Rajesh Sharma Residence',
      siteLocation: 'Charkhi Dadri, Haryana',
      mediaCount: '3',
      mediaType: 'Photos & Videos',
      updateTitle: 'RCC Slab Casting Completed',
      stepTitle: 'Structure & RCC',
      caption: 'Top grade cement and steel shuttering inspected on site.',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      amount: '50,000',
      paymentDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      paymentMode: 'UPI / Bank Transfer',
      receiptNo: 'REC-TEST-9988',
      transactionRef: 'UPI-REF-12345678',
      totalPaid: '2,50,000',
      remainingBalance: '3,00,000',
      contractAmount: '5,50,000',
      clientEmail: toEmail,
      loginPassword: 'Rajesh@123',
      portalUrl: process.env.CLIENT_PORTAL_URL || 'https://vishwakarmabuildandfurnish.in/loginuser',
      appUrl: process.env.APP_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.vishwakarmaapp',
      customerName: 'Amit Verma (Sample Inquiry)',
      phone: '+91 9416856468',
      email: toEmail,
      serviceName: 'House Construction (Turnkey)',
      categoryName: 'Residential Construction',
      address: 'Plot 45, Model Town, Haryana',
      message: 'Looking for turnkey house construction estimate with material.',
      companyName: 'Vishwakarma Build & Furnish',
      helpline: '+91 9416856468'
    };

    const subject = `[TEST PREVIEW] ` + replacePlaceholders(template.subject, sampleData);
    const heading = replacePlaceholders(template.heading, sampleData);
    const bodyHtml = replacePlaceholders(template.body, sampleData);
    const ctaText = replacePlaceholders(template.ctaText, sampleData);
    const ctaUrl = replacePlaceholders(template.ctaUrl, sampleData);
    const footerNote = replacePlaceholders(template.footerNote, sampleData);

    const fullHtml = wrapEmailHtml({
      heading,
      bodyHtml,
      ctaText,
      ctaUrl,
      footerNote
    });

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish [TEST]" <${smtpUser}>`,
      to: toEmail,
      subject,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test template email sent successfully to:', toEmail, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending test template email:', error);
    throw error;
  }
};

module.exports = {
  sendSiteMediaUpdateEmail,
  sendPaymentReceiptEmail,
  sendClientWelcomeEmail,
  sendInquiryEmail,
  sendOtpEmail,
  sendTestTemplateEmail,
  replacePlaceholders,
  wrapEmailHtml
};
