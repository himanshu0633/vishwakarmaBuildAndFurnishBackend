const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  example: { type: String, default: '' }
}, { _id: false });

const emailTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['client', 'admin', 'system'],
      default: 'client'
    },
    isEnabled: {
      type: Boolean,
      default: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    heading: {
      type: String,
      trim: true,
      default: ''
    },
    body: {
      type: String,
      required: true
    },
    ctaText: {
      type: String,
      trim: true,
      default: ''
    },
    ctaUrl: {
      type: String,
      trim: true,
      default: ''
    },
    footerNote: {
      type: String,
      trim: true,
      default: ''
    },
    availableVariables: [variableSchema],

    // Default backup to allow "Reset to Default"
    defaultSubject: { type: String, default: '' },
    defaultHeading: { type: String, default: '' },
    defaultBody: { type: String, default: '' },
    defaultCtaText: { type: String, default: '' },
    defaultCtaUrl: { type: String, default: '' },
    defaultFooterNote: { type: String, default: '' }
  },
  { timestamps: true }
);

// Standard default templates seeded automatically
const DEFAULT_TEMPLATES = [
  {
    key: 'SITE_MEDIA_UPDATE',
    name: 'Site Media & Progress Report (साइट फोटो/वीडियो रिपोर्ट अपडेट)',
    description: 'Triggers automatically when photos, videos, or site updates are added to a client project.',
    category: 'client',
    isEnabled: true,
    subject: '🏗️ Aapki Site Report Aa Gayi Hai: New Progress Photos/Videos Added - {projectName}',
    heading: 'Namaste {clientName} Ji, Aapke Project Ki Nayi Report Aa Gayi Hai!',
    body: `<div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
  <p style="margin: 0; font-size: 15px; color: #854d0e; font-weight: 700;">
    Dear <strong>{clientName}</strong> / नमस्ते <strong>{clientName}</strong> जी,
  </p>
  <p style="margin: 6px 0 0 0; font-size: 14px; color: #713f12; line-height: 1.5;">
    Aapke project <strong>{projectName}</strong> ke liye nayi site progress photos aur videos upload kar di gayi hain. Kripya niche diye gaye link par click karke apne site ki nayi report aur photos/videos check kar lein.
    <br/><br/>
    <span style="font-size: 13px; color: #854d0e;">(आपके मकान/साइट पर चल रहे काम की ताज़ा तस्वीरें व वीडियो पोर्टल में जोड़ दी गई हैं। कृपया अपनी रिपोर्ट व प्रोग्रेस चेक कर लें।)</span>
  </p>
</div>

<div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 20px;">
  <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
    📋 Progress Update Details (अपडेट विवरण)
  </h3>
  <table style="width: 100%; font-size: 13.5px; border-collapse: collapse; line-height: 1.8;">
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">📁 Files Uploaded:</td>
      <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">{mediaCount} {mediaType}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">📌 Update Title:</td>
      <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">{updateTitle}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">🏗️ Milestone Stage:</td>
      <td style="padding: 6px 0; font-weight: 700; color: #b45309;">{stepTitle}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">📍 Site Location:</td>
      <td style="padding: 6px 0; color: #0f172a;">{siteLocation}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">📅 Date:</td>
      <td style="padding: 6px 0; color: #0f172a;">{date}</td>
    </tr>
  </table>
</div>

<p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
  💡 You can also track your construction milestones, download payment slips, and monitor expenses directly from your phone.
  <br/>(आप अपने मोबाइल पर Vishwakarma App या वेबसाइट पोर्टल के माध्यम से अपने मकान के सभी बिल, रसीदें और काम की प्रोग्रेस कभी भी देख सकते हैं।)
</p>`,
    ctaText: '📱 Check Site Report / रिपोर्ट देखें →',
    ctaUrl: '{portalUrl}',
    footerNote: 'Vishwakarma Build & Furnish • From Foundation to Furniture | Helpline: +91 9416856468',
    availableVariables: [
      { key: '{clientName}', label: 'Client Name', example: 'Ramesh Kumar' },
      { key: '{projectName}', label: 'Project Name', example: 'Ramesh Kumar Residence' },
      { key: '{siteLocation}', label: 'Site Location', example: 'Charkhi Dadri' },
      { key: '{mediaCount}', label: 'Number of Files', example: '3' },
      { key: '{mediaType}', label: 'Media Type', example: 'Photos / Videos' },
      { key: '{updateTitle}', label: 'Update Title', example: 'RCC Roof Casting Complete' },
      { key: '{stepTitle}', label: 'Milestone Stage', example: 'Structure & RCC' },
      { key: '{caption}', label: 'Caption / Notes', example: 'High quality cement used' },
      { key: '{date}', label: 'Date', example: '13 Oct 2026' },
      { key: '{portalUrl}', label: 'Portal Link', example: 'https://vishwakarmabuildandfurnish.in/loginuser' },
      { key: '{appUrl}', label: 'App Play Store Link', example: 'https://play.google.com/...' },
      { key: '{companyName}', label: 'Company Name', example: 'Vishwakarma Build & Furnish' },
      { key: '{helpline}', label: 'Helpline Number', example: '+91 9416856468' }
    ]
  },
  {
    key: 'PAYMENT_RECEIPT',
    name: 'Official Payment Receipt (पेमेंट रसीद ईमेल)',
    description: 'Triggers automatically when a payment is recorded for a client project.',
    category: 'client',
    isEnabled: true,
    subject: 'Official Payment Receipt: ₹{amount} Received - Vishwakarma Build & Furnish',
    heading: 'Payment Receipt (डिजिटल रसीद) - {clientName}',
    body: `<div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
  <p style="margin: 0; font-size: 15px; color: #854d0e; font-weight: 700;">
    Dear <strong>{clientName}</strong> / नमस्ते <strong>{clientName}</strong> जी,
  </p>
  <p style="margin: 6px 0 0 0; font-size: 14px; color: #713f12; line-height: 1.5;">
    Thank you! We have received your payment of <strong>₹{amount}</strong> on <strong>{paymentDate}</strong> via <strong>{paymentMode}</strong>. This is your official verified payment slip.
    <br/><br/>
    <span style="font-size: 13px; color: #854d0e;">(धन्यवाद! आपके द्वारा ₹{amount} की पेमेंट दिनांक {paymentDate} को सफलतापूर्वक प्राप्त हो गई है। यह आपकी डिजिटल रसीद है।)</span>
  </p>
</div>

<div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 20px;">
  <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
    Receipt Information (रसीद विवरण)
  </h3>
  <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Receipt No:</td>
      <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">{receiptNo}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Date:</td>
      <td style="padding: 6px 0; color: #0f172a; text-align: right;">{paymentDate}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Mode:</td>
      <td style="padding: 6px 0; color: #0f172a; text-align: right;">{paymentMode}</td>
    </tr>
    <tr style="border-top: 1.5px solid #d4af37; border-bottom: 1.5px solid #d4af37;">
      <td style="padding: 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Amount Received:</td>
      <td style="padding: 10px 0; font-size: 16px; font-weight: 900; color: #15803d; text-align: right;">₹{amount}</td>
    </tr>
  </table>
</div>

<div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
  <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
    <tr>
      <td style="padding: 4px 0; color: #64748b;">Total Contract Amount:</td>
      <td style="padding: 4px 0; font-weight: 700; color: #0f172a; text-align: right;">₹{contractAmount}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #64748b;">Total Amount Paid So Far:</td>
      <td style="padding: 4px 0; font-weight: 700; color: #15803d; text-align: right;">₹{totalPaid}</td>
    </tr>
    <tr style="border-top: 1px dashed #94a3b8;">
      <td style="padding: 6px 0 0 0; color: #64748b; font-weight: 700;">Remaining Balance:</td>
      <td style="padding: 6px 0 0 0; font-weight: 900; color: #b45309; text-align: right; font-size: 14px;">₹{remainingBalance}</td>
    </tr>
  </table>
</div>`,
    ctaText: '📄 View Live Project & Slips →',
    ctaUrl: '{portalUrl}',
    footerNote: 'This is an electronically generated receipt from Vishwakarma Build & Furnish. For queries: +91 9416856468',
    availableVariables: [
      { key: '{clientName}', label: 'Client Name', example: 'Ramesh Kumar' },
      { key: '{amount}', label: 'Amount Paid', example: '50,000' },
      { key: '{paymentDate}', label: 'Payment Date', example: '13 Oct 2026' },
      { key: '{paymentMode}', label: 'Payment Mode', example: 'Bank Transfer / Cash' },
      { key: '{receiptNo}', label: 'Receipt Number', example: 'REC-1234' },
      { key: '{totalPaid}', label: 'Total Paid So Far', example: '1,50,000' },
      { key: '{remainingBalance}', label: 'Remaining Balance', example: '3,50,000' },
      { key: '{contractAmount}', label: 'Total Contract Amount', example: '5,00,000' },
      { key: '{portalUrl}', label: 'Portal Link', example: 'https://vishwakarmabuildandfurnish.in/loginuser' }
    ]
  },
  {
    key: 'CLIENT_WELCOME',
    name: 'Client Account & App Credentials (क्लाइंट स्वागत व ऐप लॉगिन)',
    description: 'Triggers when a new client project is created or credentials are resent.',
    category: 'client',
    isEnabled: true,
    subject: 'Download Vishwakarma App - Your Project Tracking Account is Ready',
    heading: 'Welcome {clientName} / नमस्ते {clientName} जी,',
    body: `<div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
  <p style="margin: 0; font-size: 16px; color: #854d0e; font-weight: 700;">
    Welcome <strong>{clientName}</strong> / नमस्ते <strong>{clientName}</strong> जी,
  </p>
  <p style="margin: 6px 0 0 0; font-size: 14px; color: #713f12; line-height: 1.5;">
    Welcome to <strong>Vishwakarma Build & Furnish</strong>! Your live construction project tracking account has been created. Please download our official Android App from Google Play Store to track your project live.
    <br/><br/>
    <span style="font-size: 13.5px; color: #854d0e;">(Vishwakarma Build & Furnish पर आपका स्वागत है! आपके प्रोजेक्ट का लाइव ट्रैकिंग अकाउंट एक्टिवेट कर दिया गया है। अपने प्रोजेक्ट की लाइव प्रोग्रेस और हिसाब-किताब देखने के लिए Vishwakarma App डाउनलोड करें।)</span>
  </p>
</div>

<div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border: 1.5px solid #d4af37; border-radius: 10px; padding: 20px; margin-bottom: 22px; color: #ffffff;">
  <h3 style="margin: 0 0 14px 0; color: #f59e0b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 8px;">
    🔑 Your App Login Details (ऐप लॉगिन विवरण)
  </h3>
  <table style="width: 100%; font-size: 14px; border-collapse: collapse; color: #ffffff;">
    <tr>
      <td style="padding: 8px 0; color: #94a3b8; width: 140px;">User ID / Email:</td>
      <td style="padding: 8px 0; font-weight: 700; color: #38bdf8;">{clientEmail}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #94a3b8;">Password:</td>
      <td style="padding: 8px 0; font-weight: 800; color: #facc15; font-size: 16px; letter-spacing: 0.5px;">{loginPassword}</td>
    </tr>
  </table>
</div>

<div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
  <strong>How to get started / शुरू कैसे करें:</strong><br/>
  1. नीचे दिए गए बटन पर क्लिक करके <strong>Google Play Store</strong> से <strong>Vishwakarma App</strong> डाउनलोड करें।<br/>
  2. ऐप खोलें और अपना यूजर आईडी (<strong>{clientEmail}</strong>) व पासवर्ड (<strong>{loginPassword}</strong>) डालकर लॉगिन करें।
</div>`,
    ctaText: '📲 Download Vishwakarma App (Google Play) →',
    ctaUrl: '{appUrl}',
    footerNote: 'Vishwakarma Build & Furnish • Charkhi Dadri, Haryana | Helpline: +91 9416856468',
    availableVariables: [
      { key: '{clientName}', label: 'Client Name', example: 'Ramesh Kumar' },
      { key: '{clientEmail}', label: 'Client Email / Login ID', example: 'client@gmail.com' },
      { key: '{loginPassword}', label: 'Login Password', example: 'Ramesh@123' },
      { key: '{siteLocation}', label: 'Site Location', example: 'Charkhi Dadri' },
      { key: '{contractAmount}', label: 'Contract Amount', example: '5,00,000' },
      { key: '{appUrl}', label: 'Play Store URL', example: 'https://play.google.com/...' },
      { key: '{portalUrl}', label: 'Portal URL', example: 'https://vishwakarmabuildandfurnish.in/loginuser' }
    ]
  },
  {
    key: 'NEW_INQUIRY',
    name: 'Website Lead / Inquiry Notification (नयी इन्क्वायरी नोटिफिकेशन)',
    description: 'Triggers when a customer submits a contact inquiry or quote request on the website.',
    category: 'admin',
    isEnabled: true,
    subject: 'New Lead: {customerName} - {serviceName}',
    heading: 'New Lead Received from Website',
    body: `<div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 20px;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Customer Name:</td>
      <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">{customerName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
      <td style="padding: 8px 0; color: #0f172a;"><a href="tel:{phone}">{phone}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
      <td style="padding: 8px 0; color: #0f172a;">{email}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service Requested:</td>
      <td style="padding: 8px 0; color: #d4af37; font-weight: bold;">{serviceName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569;">Category:</td>
      <td style="padding: 8px 0; color: #0f172a;">{categoryName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569;">Site/Address:</td>
      <td style="padding: 8px 0; color: #0f172a;">{address}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Message:</td>
      <td style="padding: 8px 0; color: #0f172a; white-space: pre-wrap;">{message}</td>
    </tr>
  </table>
</div>`,
    ctaText: '📞 Call Lead Now',
    ctaUrl: 'tel:{phone}',
    footerNote: 'Sent from Vishwakarma Build & Furnish website contact form.',
    availableVariables: [
      { key: '{customerName}', label: 'Customer Name', example: 'Rajesh Sharma' },
      { key: '{phone}', label: 'Phone Number', example: '+91 9876543210' },
      { key: '{email}', label: 'Email Address', example: 'rajesh@gmail.com' },
      { key: '{serviceName}', label: 'Service Requested', example: 'House Construction' },
      { key: '{categoryName}', label: 'Category', example: 'Construction' },
      { key: '{address}', label: 'Site Address', example: 'Sector 15, Hisar' },
      { key: '{message}', label: 'Customer Message', example: 'Need quotation for 200 sq yards' }
    ]
  }
];

// Attach defaults to schemas for reset
DEFAULT_TEMPLATES.forEach(tpl => {
  tpl.defaultSubject = tpl.subject;
  tpl.defaultHeading = tpl.heading;
  tpl.defaultBody = tpl.body;
  tpl.defaultCtaText = tpl.ctaText;
  tpl.defaultCtaUrl = tpl.ctaUrl;
  tpl.defaultFooterNote = tpl.footerNote;
});

// Seed/ensure templates exist
emailTemplateSchema.statics.getOrSeedTemplate = async function (key) {
  const upperKey = (key || '').toUpperCase();
  let template = await this.findOne({ key: upperKey });
  if (!template) {
    const defaultData = DEFAULT_TEMPLATES.find(t => t.key === upperKey);
    if (defaultData) {
      template = await this.create(defaultData);
    }
  }
  return template;
};

emailTemplateSchema.statics.getAllAndSeed = async function () {
  for (const defaultData of DEFAULT_TEMPLATES) {
    const exists = await this.findOne({ key: defaultData.key });
    if (!exists) {
      await this.create(defaultData);
    }
  }
  return this.find({}).sort({ category: 1, key: 1 });
};

emailTemplateSchema.statics.getDefaults = function () {
  return DEFAULT_TEMPLATES;
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
