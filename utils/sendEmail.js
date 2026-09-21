const nodemailer = require('nodemailer');

const sendInquiryEmail = async (inquiry) => {
  try {
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const toEmail = process.env.NOTIFICATION_EMAIL || 'vishwakarmabuildandfurnish@gmail.com';

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

const sendPaymentReceiptEmail = async ({ client, payment, totalPaid, remainingBalance }) => {
  try {
    if (!client?.email) {
      console.log('ℹ️ Client has no email. Skipping payment receipt email.');
      return false;
    }

    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

    if (!smtpPass) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping email notification.');
      console.log('Payment Receipt Details:', {
        client: client.name,
        email: client.email,
        receiptNo: payment.receiptNo,
        amount: payment.amount,
        date: payment.date
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

    const formattedDate = new Date(payment.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const portalUrl = process.env.CLIENT_PORTAL_URL || 'https://vishwakarmabuildandfurnish.in/loginuser';

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: client.email,
      subject: `Official Payment Receipt: ₹${Number(payment.amount).toLocaleString('en-IN')} Received - Vishwakarma Build & Furnish`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; border: 1.5px solid #d4af37; border-radius: 12px; max-width: 600px; background-color: #ffffff; color: #1e293b;">
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

          <!-- Thank you message (English & Hinglish) -->
          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 15px; color: #854d0e; font-weight: 700;">
              Dear <strong>${client.name}</strong> / नमस्ते <strong>${client.name}</strong> जी,
            </p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #713f12; line-height: 1.5;">
              Thank you! We have received your payment of <strong>₹${Number(payment.amount).toLocaleString('en-IN')}</strong> on <strong>${formattedDate}</strong> via <strong>${payment.paymentMode || 'Cash'}</strong>. This is your official verified payment slip.
              <br/><br/>
              <span style="font-size: 13px; color: #854d0e;">(धन्यवाद! आपके द्वारा ₹${Number(payment.amount).toLocaleString('en-IN')} की पेमेंट दिनांक ${formattedDate} को सफलतापूर्वक प्राप्त हो गई है। यह आपकी डिजिटल रसीद है।)</span>
            </p>
          </div>

          <!-- Receipt Details -->
          <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
              Receipt Information (रसीद विवरण)
            </h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Receipt No:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${payment.receiptNo}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Date:</td>
                <td style="padding: 6px 0; color: #0f172a; text-align: right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Mode:</td>
                <td style="padding: 6px 0; color: #0f172a; text-align: right;">${payment.paymentMode || 'Cash'}</td>
              </tr>
              ${payment.transactionRef ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Transaction Ref:</td>
                <td style="padding: 6px 0; color: #0f172a; text-align: right;">${payment.transactionRef}</td>
              </tr>
              ` : ''}
              ${payment.stepTitle ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Stage / Milestone:</td>
                <td style="padding: 6px 0; color: #0f172a; text-align: right;">${payment.stepTitle}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 1.5px solid #d4af37; border-bottom: 1.5px solid #d4af37;">
                <td style="padding: 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Amount Received:</td>
                <td style="padding: 10px 0; font-size: 16px; font-weight: 900; color: #15803d; text-align: right;">₹${Number(payment.amount).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <!-- Account Summary -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Total Contract Amount:</td>
                <td style="padding: 4px 0; font-weight: 700; color: #0f172a; text-align: right;">₹${Number(client.contractAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Total Amount Paid So Far:</td>
                <td style="padding: 4px 0; font-weight: 700; color: #15803d; text-align: right;">₹${Number(totalPaid || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 1px dashed #94a3b8;">
                <td style="padding: 6px 0 0 0; color: #64748b; font-weight: 700;">Remaining Balance:</td>
                <td style="padding: 6px 0 0 0; font-weight: 900; color: #b45309; text-align: right; font-size: 14px;">₹${Number(remainingBalance || 0).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <!-- Dual Language Action Buttons -->
          <div style="text-align: center; margin: 24px 0 16px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b45309 100%); color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: 800; font-size: 14px; text-decoration: none; margin: 4px; box-shadow: 0 4px 12px rgba(212,175,55,0.35);">
              📄 View Live Project & Slips (English) &rarr;
            </a>
            <a href="${portalUrl}" style="display: inline-block; background: #0f172a; border: 1.5px solid #d4af37; color: #facc15; padding: 11px 22px; border-radius: 6px; font-weight: 700; font-size: 14px; text-decoration: none; margin: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
              🏗️ प्रोजेक्ट रिपोर्ट व रसीद देखें (Hinglish) &rarr;
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">This is an electronically generated receipt from Vishwakarma Build & Furnish.</p>
            <p style="margin: 4px 0 0 0;">For any queries, please call us at +91 9416856468.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment receipt email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending payment receipt email:', error);
    return false;
  }
};

const sendClientWelcomeEmail = async ({ client, loginPassword, loginUrl }) => {
  try {
    if (!client?.email) {
      console.log('ℹ️ Client has no email. Skipping welcome credentials email.');
      return false;
    }

    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const portalUrl = loginUrl || process.env.CLIENT_PORTAL_URL || 'https://vishwakarmabuildandfurnish.in/loginuser';

    if (!smtpPass) {
      console.warn('⚠️ SMTP_PASS is not configured in .env. Skipping welcome email notification.');
      console.log('Client Welcome Credentials Details:', {
        client: client.name,
        email: client.email,
        password: loginPassword,
        portalUrl
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
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: client.email,
      subject: `Your Client Portal Account is Ready - Vishwakarma Build & Furnish`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; border: 1.5px solid #d4af37; border-radius: 12px; max-width: 600px; background-color: #ffffff; color: #1e293b;">
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

          <!-- Greeting (English & Hinglish) -->
          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px; color: #854d0e; font-weight: 700;">
              Welcome <strong>${client.name}</strong> / नमस्ते <strong>${client.name}</strong> जी,
            </p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #713f12; line-height: 1.5;">
              Welcome to <strong>Vishwakarma Build & Furnish</strong>! Your live construction project tracking portal account has been created successfully.
              <br/><br/>
              <span style="font-size: 13.5px; color: #854d0e;">(Vishwakarma Build & Furnish पर आपका स्वागत है! आपके प्रोजेक्ट का लाइव ट्रैकिंग पोर्टल अकाउंट एक्टिवेट कर दिया गया है।)</span>
            </p>
          </div>

          <!-- Project Portal Description -->
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 14px;">
            Log in to the portal to view live site progress and project accounts anytime:
            <br/>
            <span style="font-size: 13px; color: #64748b;">(पोर्टल पर लॉगिन करके आप अपने साइट की लाइव प्रोग्रेस और हिसाब-किताब कभी भी देख सकते हैं:)</span>
          </p>
          <ul style="font-size: 13.5px; color: #475569; line-height: 1.8; margin-bottom: 22px; padding-left: 20px;">
            <li><strong>Live Construction Progress:</strong> Completed milestone steps & checkpoints (Foundation, Nim Bharna, RCC, Water Tank, Finishing).</li>
            <li><strong>Payment & Balance:</strong> Dates and amounts of all payments recorded and balance due.</li>
            <li><strong>Official Payment Slips:</strong> Download verified GST digital receipts/slips anytime.</li>
            <li><strong>Material Deliveries:</strong> Number of Trucks, Litres, and Bags delivered to your site.</li>
            <li><strong>Site Agreement:</strong> View your signed site agreement document.</li>
          </ul>

          <!-- Credentials Box -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border: 1.5px solid #d4af37; border-radius: 10px; padding: 18px; margin-bottom: 22px; color: #ffffff;">
            <h3 style="margin: 0 0 12px 0; color: #f59e0b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px;">
              🔑 Your Login Credentials (लॉगिन विवरण)
            </h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse; color: #ffffff;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 130px;">Portal Link:</td>
                <td style="padding: 6px 0; font-weight: 600;">
                  <a href="${portalUrl}" style="color: #60a5fa; text-decoration: underline;">${portalUrl}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">User ID / Email:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #38bdf8;">${client.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Password:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #facc15; font-size: 16px; letter-spacing: 0.5px;">${loginPassword}</td>
              </tr>
            </table>

            <!-- Dual Language Action Buttons -->
            <div style="text-align: center; margin-top: 20px;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b45309 100%); color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: 800; font-size: 14px; text-decoration: none; margin: 4px; box-shadow: 0 4px 12px rgba(212,175,55,0.35);">
                🔑 Login to Client Portal (English) &rarr;
              </a>
              <a href="${portalUrl}" style="display: inline-block; background: #0f172a; border: 1.5px solid #d4af37; color: #facc15; padding: 11px 22px; border-radius: 6px; font-weight: 700; font-size: 14px; text-decoration: none; margin: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                🏗️ पोर्टल पर लॉगिन करें (Hinglish) &rarr;
              </a>
            </div>
          </div>

          <!-- Security note -->
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 10px 14px; margin-bottom: 20px; font-size: 12.5px; color: #475569;">
            <strong>Security Notice / सुरक्षा सूचना:</strong> You can open the link above on your mobile or computer and log in with your email and password to view live construction updates.
          </div>

          <!-- Footer -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8; text-align: center;">
            <p style="margin: 0; font-weight: 600; color: #64748b;">Vishwakarma Build & Furnish</p>
            <p style="margin: 4px 0 0 0;">Charkhi Dadri, Haryana | Helpline: +91 9416856468</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Client welcome email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending client welcome email:', error);
    return false;
  }
};

const sendOtpEmail = async ({ toEmail, otp, purpose }) => {
  try {
    const smtpUser = process.env.SMTP_USER || 'vishwakarmabuildandfurnish@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

    if (!smtpPass || !toEmail) return false;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"Vishwakarma Build & Furnish" <${smtpUser}>`,
      to: toEmail,
      subject: `Your Verification OTP Code: ${otp} - Vishwakarma Build & Furnish`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 8px; max-width: 500px; color: #1e293b;">
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

module.exports = { sendInquiryEmail, sendPaymentReceiptEmail, sendClientWelcomeEmail, sendOtpEmail };


