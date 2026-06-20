const nodemailer = require('nodemailer');

const sendInquiryEmail = async (inquiry) => {
  try {
    const smtpUser = process.env.SMTP_USER || 'himanshujangra0633@gmail.com';
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.NOTIFICATION_EMAIL || 'himanshujangra0633@gmail.com';

    // If SMTP_PASS is not configured, we print a warning and skip sending
    if (!smtpPass) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping email notification.');
      console.log('Lead Details:', {
        name: inquiry.customerName,
        phone: inquiry.phone,
        service: inquiry.serviceName,
        message: inquiry.message
      });
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"Vishwakarma Leads" <${smtpUser}>`,
      to: toEmail,
      subject: `New Lead: ${inquiry.customerName} - ${inquiry.serviceName || 'General Quote'}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 8px; max-width: 600px; background-color: #fcfcfc;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 0;">New Lead Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Customer Name:</td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${inquiry.phone}">${inquiry.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service Requested:</td>
              <td style="padding: 8px 0; color: #d4af37; font-weight: bold;">${inquiry.serviceName || 'General Quote'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Category:</td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.categoryName || 'General'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Site/Address:</td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.address || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #0f172a; white-space: pre-wrap;">${inquiry.message || 'No message provided'}</td>
            </tr>
          </table>
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 0.85em; color: #64748b; text-align: center;">
            Sent from Vishwakarma Build & Furnish website contact form.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notification sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
};

module.exports = { sendInquiryEmail };
