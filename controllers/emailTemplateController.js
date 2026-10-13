const EmailTemplate = require('../models/EmailTemplate');
const { sendTestTemplateEmail } = require('../utils/sendEmail');

// @desc    Get all email templates (and seed defaults if missing)
// @route   GET /api/email-templates
// @access  Private (Admin)
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.getAllAndSeed();
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error.message
    });
  }
};

// @desc    Get a single email template by key
// @route   GET /api/email-templates/:key
// @access  Private (Admin)
exports.getTemplateByKey = async (req, res) => {
  try {
    const template = await EmailTemplate.getOrSeedTemplate(req.params.key);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template not found for key: ${req.params.key}`
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email template',
      error: error.message
    });
  }
};

// @desc    Update email template content & settings
// @route   PUT /api/email-templates/:key
// @access  Private (Admin)
exports.updateTemplate = async (req, res) => {
  try {
    const key = (req.params.key || '').toUpperCase();
    let template = await EmailTemplate.getOrSeedTemplate(key);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Email template not found for key: ${key}`
      });
    }

    const {
      name,
      description,
      isEnabled,
      subject,
      heading,
      body,
      ctaText,
      ctaUrl,
      footerNote
    } = req.body;

    if (name !== undefined) template.name = name.trim();
    if (description !== undefined) template.description = description.trim();
    if (isEnabled !== undefined) template.isEnabled = Boolean(isEnabled);
    if (subject !== undefined) template.subject = subject.trim();
    if (heading !== undefined) template.heading = heading.trim();
    if (body !== undefined) template.body = body;
    if (ctaText !== undefined) template.ctaText = ctaText.trim();
    if (ctaUrl !== undefined) template.ctaUrl = ctaUrl.trim();
    if (footerNote !== undefined) template.footerNote = footerNote.trim();

    await template.save();

    res.json({
      success: true,
      message: `Email template '${template.name}' updated successfully`,
      data: template
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error.message
    });
  }
};

// @desc    Quick toggle ON/OFF for an email template action
// @route   POST /api/email-templates/:key/toggle
// @access  Private (Admin)
exports.toggleTemplate = async (req, res) => {
  try {
    const key = (req.params.key || '').toUpperCase();
    let template = await EmailTemplate.getOrSeedTemplate(key);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Email template not found for key: ${key}`
      });
    }

    // Toggle or set explicitly
    if (req.body.isEnabled !== undefined) {
      template.isEnabled = Boolean(req.body.isEnabled);
    } else {
      template.isEnabled = !template.isEnabled;
    }

    await template.save();

    res.json({
      success: true,
      message: `Email notification for '${template.name}' is now ${template.isEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`,
      data: template
    });
  } catch (error) {
    console.error('Error toggling email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle email template',
      error: error.message
    });
  }
};

// @desc    Reset email template to system defaults
// @route   POST /api/email-templates/:key/reset
// @access  Private (Admin)
exports.resetTemplate = async (req, res) => {
  try {
    const key = (req.params.key || '').toUpperCase();
    const defaults = EmailTemplate.getDefaults().find(t => t.key === key);

    if (!defaults) {
      return res.status(404).json({
        success: false,
        message: `No default template found for key: ${key}`
      });
    }

    let template = await EmailTemplate.findOne({ key });
    if (!template) {
      template = new EmailTemplate(defaults);
    } else {
      template.name = defaults.name;
      template.description = defaults.description;
      template.subject = defaults.defaultSubject || defaults.subject;
      template.heading = defaults.defaultHeading || defaults.heading;
      template.body = defaults.defaultBody || defaults.body;
      template.ctaText = defaults.defaultCtaText || defaults.ctaText;
      template.ctaUrl = defaults.defaultCtaUrl || defaults.ctaUrl;
      template.footerNote = defaults.defaultFooterNote || defaults.footerNote;
      template.availableVariables = defaults.availableVariables;
    }

    await template.save();

    res.json({
      success: true,
      message: `Template '${template.name}' reset to system defaults`,
      data: template
    });
  } catch (error) {
    console.error('Error resetting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset email template',
      error: error.message
    });
  }
};

// @desc    Send a test preview email to an admin address
// @route   POST /api/email-templates/:key/test
// @access  Private (Admin)
exports.sendTestEmail = async (req, res) => {
  try {
    const key = (req.params.key || '').toUpperCase();
    const { toEmail, draftTemplate } = req.body;

    if (!toEmail || !toEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid recipient email address'
      });
    }

    const result = await sendTestTemplateEmail({
      key,
      toEmail,
      overrideTemplate: draftTemplate || null
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${toEmail}! Please check your inbox / spam folder.`,
      data: result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: `Failed to send test email: ${error.message}`,
      error: error.message
    });
  }
};
