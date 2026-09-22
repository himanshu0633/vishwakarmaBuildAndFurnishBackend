const Client = require('../models/Client');
const ClientPayment = require('../models/ClientPayment');
const ClientExpense = require('../models/ClientExpense');
const LabourWorker = require('../models/LabourWorker');
const LabourAttendance = require('../models/LabourAttendance');
const LabourPayment = require('../models/LabourPayment');
const Material = require('../models/Material');
const User = require('../models/User');
const { sendPaymentReceiptEmail, sendClientWelcomeEmail } = require('../utils/sendEmail');
const { publicUploadPath } = require('../utils/uploadStorage');

// Helper to generate client password: First word of name + '@123'
const generateClientPassword = (name = '') => {
  const firstWord = (name || 'Client').trim().split(/\s+/)[0];
  const sanitized = firstWord.replace(/[^a-zA-Z0-9]/g, '') || 'Client';
  return `${sanitized}@123`;
};

// Default milestone steps for new clients
const DEFAULT_CLIENT_STEPS = [
  {
    title: 'Step 1: Advance Booking & Site Prep',
    percentage: 20,
    amountExpected: 0,
    isPaid: false,
    completed: false,
    points: [
      { title: 'Site Inspection & Demarcation', completed: false },
      { title: 'Architectural / 3D Layout Finalization', completed: false },
      { title: 'Excavation / Site Digging', completed: false }
    ]
  },
  {
    title: 'Step 2: Foundation & Plinth (Nim Bharna)',
    percentage: 25,
    amountExpected: 0,
    isPaid: false,
    completed: false,
    points: [
      { title: 'Footing & Column Base Casting', completed: false },
      { title: 'Nim Bharna & Stone Masonry', completed: false },
      { title: 'Plinth Beam Casting & Anti-Termite Treatment', completed: false },
      { title: 'Soil Compaction & DPC Layer', completed: false }
    ]
  },
  {
    title: 'Step 3: Superstructure & RCC Slab Casting',
    percentage: 25,
    amountExpected: 0,
    isPaid: false,
    completed: false,
    points: [
      { title: 'RCC Columns / Pillars Erection', completed: false },
      { title: 'Shuttering & Steel (Saria) Binding', completed: false },
      { title: 'Roof Slab RCC Casting & Curing', completed: false },
      { title: 'Staircase RCC Construction', completed: false }
    ]
  },
  {
    title: 'Step 4: Brickwork, Plumbing & Water Tank',
    percentage: 20,
    amountExpected: 0,
    isPaid: false,
    completed: false,
    points: [
      { title: 'Exterior & Interior Brickwork Walls', completed: false },
      { title: 'Electrical Conduit & Pipe Fittings', completed: false },
      { title: 'Sanitary & Water Supply Pipeline Setup', completed: false },
      { title: 'Overhead Water Tank (Pani Ki Tanki) Installation', completed: false }
    ]
  },
  {
    title: 'Step 5: Plaster, Flooring & Final Finishing',
    percentage: 10,
    amountExpected: 0,
    isPaid: false,
    completed: false,
    points: [
      { title: 'Internal & External Wall Plaster', completed: false },
      { title: 'Flooring Tiles & Marble Fitting', completed: false },
      { title: 'Doors, Windows & Woodwork Installation', completed: false },
      { title: 'Wall Putty, Primer & Final Paint Polish', completed: false }
    ]
  }
];

// Helper to generate unique sequential receipt number
const generateReceiptNo = async () => {
  const year = new Date().getFullYear();
  const count = await ClientPayment.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `VBF-REC-${year}-${sequence}`;
};

// @desc    Get all clients with payment & progress summary
// @route   GET /api/clients
exports.getAllClients = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = { isDeleted: { $ne: true } };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { phone: regex }, { location: regex }, { aadharNo: regex }];
    }

    const clients = await Client.find(query)
      .populate('categories', 'name slug emoji icon image')
      .populate('services', 'name title category price categoryId')
      .sort({ createdAt: -1 });

    // Attach payment & expense summaries for each client
    const clientSummaries = await Promise.all(
      clients.map(async (client) => {
        const payments = await ClientPayment.find({ clientId: client._id, isDeleted: { $ne: true } });
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const remainingBalance = Math.max(0, (client.contractAmount || 0) - totalPaid);

        return {
          ...client.toObject(),
          totalPaid,
          remainingBalance,
          paymentCount: payments.length,
          progressPercentage: client.progressPercentage
        };
      })
    );

    res.status(200).json({
      success: true,
      count: clientSummaries.length,
      data: clientSummaries
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message
    });
  }
};

// @desc    Get single client full details with payments & expenses
// @route   GET /api/clients/:id
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('categories', 'name slug emoji icon image')
      .populate({
        path: 'services',
        select: 'name title category price heroImage categoryId',
        populate: { path: 'categoryId', select: 'name emoji icon' }
      });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Fetch active payments
    const payments = await ClientPayment.find({ clientId: client._id, isDeleted: { $ne: true } }).sort({ date: -1, createdAt: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingBalance = Math.max(0, (client.contractAmount || 0) - totalPaid);

    // Fetch active expenses
    const { materialId } = req.query;
    const expenseQuery = { clientId: client._id, isDeleted: { $ne: true } };
    if (materialId) {
      expenseQuery.materialId = materialId;
    }

    const allExpenses = await ClientExpense.find({ clientId: client._id, isDeleted: { $ne: true } }).sort({ date: -1 });
    const filteredExpenses = materialId ? await ClientExpense.find(expenseQuery).sort({ date: -1 }) : allExpenses;

    // Financial breakdown
    let materialExpensesTotal = 0;
    let transportExpensesTotal = 0;
    let otherExpensesTotal = 0;

    allExpenses.forEach((exp) => {
      if (exp.expenseType === 'material') {
        materialExpensesTotal += Number(exp.materialCost || 0);
        if (!exp.transportIncluded) {
          transportExpensesTotal += Number(exp.transportCost || 0);
        }
      } else {
        otherExpensesTotal += Number(exp.totalAmount || 0);
      }
    });

    // Labour Expenses breakdown
    const labourPaymentsAgg = await LabourPayment.aggregate([
      { $match: { clientId: client._id, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const labourExpensesTotal = labourPaymentsAgg[0]?.total || 0;
    const labourPaymentsCount = labourPaymentsAgg[0]?.count || 0;

    const totalExpenses = materialExpensesTotal + transportExpensesTotal + otherExpensesTotal + labourExpensesTotal;
    const netProfit = totalPaid - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        client: {
          ...client.toObject(),
          progressPercentage: client.progressPercentage
        },
        financials: {
          contractAmount: client.contractAmount || 0,
          totalPaid,
          remainingBalance,
          materialExpensesTotal,
          transportExpensesTotal,
          labourExpensesTotal,
          labourPaymentsCount,
          otherExpensesTotal,
          totalExpenses,
          netProfit
        },
        payments,
        expenses: filteredExpenses,
        allExpensesCount: allExpenses.length
      }
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client details',
      error: error.message
    });
  }
};

// @desc    Create new client
// @route   POST /api/clients
exports.createClient = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      location,
      aadharNo,
      categories,
      services,
      serviceRate,
      serviceRateUnit,
      contractAmount,
      status,
      startDate,
      expectedEndDate,
      steps,
      notes
    } = req.body;

    if (!name || !phone || !location || contractAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, Location and Contract Amount are required'
      });
    }

    // Handle agreement image upload if uploaded
    let agreementImage = '';
    if (req.files && (req.files.agreementImage || req.files.agreementFile)) {
      const file = (req.files.agreementImage || req.files.agreementFile)[0];
      agreementImage = publicUploadPath('clients', file.filename);
    } else if (req.body.agreementImage) {
      agreementImage = req.body.agreementImage;
    }

    // Parse categories
    let parsedCategories = [];
    if (categories) {
      if (Array.isArray(categories)) {
        parsedCategories = categories;
      } else if (typeof categories === 'string') {
        try {
          parsedCategories = JSON.parse(categories);
        } catch {
          parsedCategories = [categories];
        }
      }
    }

    // Parse services
    let parsedServices = [];
    if (services) {
      if (Array.isArray(services)) {
        parsedServices = services;
      } else if (typeof services === 'string') {
        try {
          parsedServices = JSON.parse(services);
        } catch {
          parsedServices = [services];
        }
      }
    }

    // Parse or default steps
    let parsedSteps = DEFAULT_CLIENT_STEPS;
    if (steps) {
      const rawSteps = typeof steps === 'string' ? JSON.parse(steps) : steps;
      if (Array.isArray(rawSteps) && rawSteps.length > 0) {
        parsedSteps = rawSteps;
      }
    }

    // Guard against rapid duplicate clicks / double submission (within last 7 seconds)
    if (phone || email) {
      const recentClient = await Client.findOne({
        $or: [
          ...(phone ? [{ phone: phone.trim() }] : []),
          ...(email ? [{ email: email.trim().toLowerCase() }] : [])
        ],
        createdAt: { $gte: new Date(Date.now() - 7000) }
      });
      if (recentClient) {
        return res.status(200).json({
          success: true,
          message: 'Client project already created (duplicate prevented)',
          data: recentClient,
          duplicatePrevented: true
        });
      }
    }

    const client = await Client.create({
      name: name.trim(),
      phone: phone.trim(),
      email: (email || '').trim().toLowerCase(),
      location: location.trim(),
      aadharNo: (aadharNo || '').trim(),
      categories: parsedCategories,
      services: parsedServices,
      serviceRate: Number(serviceRate) || 0,
      serviceRateUnit: (serviceRateUnit || 'Per Sq.Ft / Lump-sum').trim(),
      contractAmount: Number(contractAmount) || 0,
      agreementImage,
      status: status || 'active',
      startDate: startDate ? new Date(startDate) : new Date(),
      expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
      steps: parsedSteps,
      notes: (notes || '').trim()
    });

    let clientPassword = '';
    let welcomeEmailSent = false;

    // If client has an email, auto-create client User portal account with <FirstName>@123 password
    if (client.email) {
      clientPassword = generateClientPassword(client.name);
      try {
        let clientUser = await User.findOne({
          $or: [
            { email: client.email.toLowerCase() },
            ...(client.phone ? [{ mobile: client.phone }] : [])
          ]
        });

        if (clientUser) {
          clientUser.clientId = client._id;
          if (clientUser.role !== 'admin') {
            clientUser.role = 'client';
          }
          clientUser.password = clientPassword;
          if (!clientUser.email && client.email) {
            clientUser.email = client.email.toLowerCase();
          }
          await clientUser.save();
        } else {
          clientUser = await User.create({
            name: client.name,
            email: client.email.toLowerCase(),
            mobile: client.phone || undefined,
            password: clientPassword,
            role: 'client',
            clientId: client._id,
            emailVerified: true
          });
        }

        client.user = clientUser._id;
        client.loginPassword = clientPassword;
        await client.save();

        welcomeEmailSent = await sendClientWelcomeEmail({
          client,
          loginPassword: clientPassword
        });
      } catch (err) {
        console.error('Error creating user account or sending welcome email for client:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
      credentials: client.email ? {
        email: client.email,
        password: clientPassword,
        welcomeEmailSent
      } : null
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error.message
    });
  }
};

// @desc    Update client profile/contract
// @route   PUT /api/clients/:id
// @access  Private (Admin)
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const {
      name,
      phone,
      email,
      location,
      aadharNo,
      categories,
      services,
      serviceRate,
      serviceRateUnit,
      contractAmount,
      status,
      startDate,
      expectedEndDate,
      notes
    } = req.body;

    if (name) client.name = name.trim();
    if (phone) client.phone = phone.trim();
    if (email !== undefined) client.email = email.trim().toLowerCase();
    if (location) client.location = location.trim();
    if (aadharNo !== undefined) client.aadharNo = aadharNo.trim();
    if (serviceRate !== undefined) client.serviceRate = Number(serviceRate) || 0;
    if (serviceRateUnit !== undefined) client.serviceRateUnit = serviceRateUnit.trim();
    if (contractAmount !== undefined) client.contractAmount = Number(contractAmount) || 0;
    if (status) client.status = status;
    if (startDate) client.startDate = new Date(startDate);
    if (expectedEndDate) client.expectedEndDate = new Date(expectedEndDate);
    if (notes !== undefined) client.notes = notes.trim();

    if (categories !== undefined) {
      if (Array.isArray(categories)) {
        client.categories = categories;
      } else if (typeof categories === 'string') {
        try {
          client.categories = JSON.parse(categories);
        } catch {
          client.categories = [categories];
        }
      }
    }

    if (services) {
      if (Array.isArray(services)) {
        client.services = services;
      } else if (typeof services === 'string') {
        try {
          client.services = JSON.parse(services);
        } catch {
          client.services = [services];
        }
      }
    }

    if (req.body.steps !== undefined) {
      if (Array.isArray(req.body.steps)) {
        client.steps = req.body.steps;
      } else if (typeof req.body.steps === 'string') {
        try {
          client.steps = JSON.parse(req.body.steps);
        } catch {
          // ignore
        }
      }
    }

    if (req.files && (req.files.agreementImage || req.files.agreementFile)) {
      const file = (req.files.agreementImage || req.files.agreementFile)[0];
      client.agreementImage = publicUploadPath('clients', file.filename);
    } else if (req.body.agreementImage !== undefined) {
      client.agreementImage = req.body.agreementImage;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message
    });
  }
};

// @desc    Soft delete client & cascade soft delete to payments and expenses
// @route   DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const now = new Date();
    client.isDeleted = true;
    client.deletedAt = now;
    await client.save();

    // Cascade soft delete payments, expenses, and labour records
    await Promise.all([
      ClientPayment.updateMany({ clientId: client._id }, { $set: { isDeleted: true, deletedAt: now } }),
      ClientExpense.updateMany({ clientId: client._id }, { $set: { isDeleted: true, deletedAt: now } }),
      LabourWorker.updateMany({ clientId: client._id }, { $set: { isDeleted: true, deletedAt: now } }),
      LabourAttendance.updateMany({ clientId: client._id }, { $set: { isDeleted: true, deletedAt: now } }),
      LabourPayment.updateMany({ clientId: client._id }, { $set: { isDeleted: true, deletedAt: now } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Client and all associated records soft-deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error.message
    });
  }
};

// @desc    Restore soft-deleted client
// @route   PUT /api/clients/:id/restore
exports.restoreClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: true });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Soft-deleted client not found'
      });
    }

    client.isDeleted = false;
    client.deletedAt = undefined;
    await client.save();

    // Restore associated payments, expenses, and labour records
    await Promise.all([
      ClientPayment.updateMany({ clientId: client._id }, { $set: { isDeleted: false }, $unset: { deletedAt: 1 } }),
      ClientExpense.updateMany({ clientId: client._id }, { $set: { isDeleted: false }, $unset: { deletedAt: 1 } }),
      LabourWorker.updateMany({ clientId: client._id }, { $set: { isDeleted: false }, $unset: { deletedAt: 1 } }),
      LabourAttendance.updateMany({ clientId: client._id }, { $set: { isDeleted: false }, $unset: { deletedAt: 1 } }),
      LabourPayment.updateMany({ clientId: client._id }, { $set: { isDeleted: false }, $unset: { deletedAt: 1 } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Client and records restored successfully',
      data: client
    });
  } catch (error) {
    console.error('Error restoring client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore client',
      error: error.message
    });
  }
};

// @desc    Update client milestone steps / toggle point completion
// @route   PUT /api/clients/:id/milestones
exports.updateClientMilestones = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const { steps, togglePoint } = req.body;

    // Option A: Quick toggle single point
    if (togglePoint) {
      const { stepId, pointId, completed } = togglePoint;
      const step = client.steps.id(stepId);
      if (step) {
        const point = step.points.id(pointId);
        if (point) {
          point.completed = completed;
          point.completedAt = completed ? new Date() : undefined;

          // If all points in step completed, auto-mark step completed
          const allPointsDone = step.points.every((p) => p.completed);
          step.completed = allPointsDone;
          step.completedAt = allPointsDone ? new Date() : undefined;
        }
      }
    } else if (req.body.addPoint) {
      // Option B: Quick add single point to a step
      const { stepId, title } = req.body.addPoint;
      const step = client.steps.id(stepId);
      if (step && title && title.trim()) {
        step.points.push({ title: title.trim(), completed: false });
        step.completed = step.points.every((p) => p.completed);
      }
    } else if (req.body.deletePoint) {
      // Option C: Quick delete single point from a step
      const { stepId, pointId } = req.body.deletePoint;
      const step = client.steps.id(stepId);
      if (step) {
        step.points = step.points.filter((p) => p._id.toString() !== pointId.toString());
        step.completed = step.points.length > 0 ? step.points.every((p) => p.completed) : false;
      }
    } else if (steps) {
      // Option D: Full steps array update
      client.steps = typeof steps === 'string' ? JSON.parse(steps) : steps;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Milestones updated successfully',
      data: client.steps,
      progressPercentage: client.progressPercentage
    });
  } catch (error) {
    console.error('Error updating milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestones',
      error: error.message
    });
  }
};

// @desc    Add payment for client and send email receipt
// @route   POST /api/clients/:id/payments
exports.addClientPayment = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const { amount, date, paymentMode, transactionRef, stepId, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid payment amount is required'
      });
    }

    // Guard against rapid duplicate clicks / double submission (within last 7 seconds)
    const recentDuplicate = await ClientPayment.findOne({
      clientId: client._id,
      amount: Number(amount),
      isDeleted: { $ne: true },
      createdAt: { $gte: new Date(Date.now() - 7000) }
    });

    if (recentDuplicate) {
      const allPayments = await ClientPayment.find({ clientId: client._id, isDeleted: { $ne: true } });
      const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remainingBalance = Math.max(0, (client.contractAmount || 0) - totalPaid);
      return res.status(200).json({
        success: true,
        message: 'Payment already recorded (duplicate prevented)',
        data: {
          payment: recentDuplicate,
          totalPaid,
          remainingBalance,
          emailSent: recentDuplicate.emailSent,
          duplicatePrevented: true
        }
      });
    }

    const receiptNo = await generateReceiptNo();

    // Find step title if stepId is provided
    let stepTitle = '';
    if (stepId && client.steps) {
      const linkedStep = client.steps.id(stepId);
      if (linkedStep) {
        stepTitle = linkedStep.title;
        linkedStep.isPaid = true;
        await client.save();
      }
    }

    const payment = await ClientPayment.create({
      clientId: client._id,
      receiptNo,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      paymentMode: paymentMode || 'Cash',
      transactionRef: (transactionRef || '').trim(),
      stepId: stepId || undefined,
      stepTitle,
      notes: (notes || '').trim()
    });

    // Calculate current financial totals for email
    const allPayments = await ClientPayment.find({ clientId: client._id, isDeleted: { $ne: true } });
    const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingBalance = Math.max(0, (client.contractAmount || 0) - totalPaid);

    // Send receipt email asynchronously to client if email exists
    let emailSent = false;
    if (client.email) {
      emailSent = await sendPaymentReceiptEmail({
        client,
        payment,
        totalPaid,
        remainingBalance
      });
      if (emailSent) {
        payment.emailSent = true;
        payment.emailSentAt = new Date();
        await payment.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        totalPaid,
        remainingBalance,
        emailSent
      }
    });
  } catch (error) {
    console.error('Error adding client payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// @desc    Soft-delete payment record
// @route   DELETE /api/clients/:id/payments/:paymentId
exports.deleteClientPayment = async (req, res) => {
  try {
    const payment = await ClientPayment.findOne({
      _id: req.params.paymentId,
      clientId: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Soft delete: flag as deleted without wiping database record
    payment.isDeleted = true;
    payment.deletedAt = new Date();
    await payment.save();

    // If payment was tied to a milestone step, verify if any active payment remains
    if (payment.stepId) {
      const activeStepPayments = await ClientPayment.countDocuments({
        clientId: req.params.id,
        stepId: payment.stepId,
        isDeleted: { $ne: true }
      });
      if (activeStepPayments === 0) {
        const client = await Client.findById(req.params.id);
        if (client && client.steps) {
          const step = client.steps.id(payment.stepId);
          if (step) {
            step.isPaid = false;
            await client.save();
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment record soft-deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

// @desc    Restore soft-deleted payment record
// @route   PUT /api/clients/:id/payments/:paymentId/restore
exports.restoreClientPayment = async (req, res) => {
  try {
    const payment = await ClientPayment.findOne({
      _id: req.params.paymentId,
      clientId: req.params.id,
      isDeleted: true
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Soft-deleted payment record not found'
      });
    }

    payment.isDeleted = false;
    payment.deletedAt = undefined;
    await payment.save();

    if (payment.stepId) {
      const client = await Client.findById(req.params.id);
      if (client && client.steps) {
        const step = client.steps.id(payment.stepId);
        if (step) {
          step.isPaid = true;
          await client.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment record restored successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error restoring payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore payment',
      error: error.message
    });
  }
};

// @desc    Add material or other expense for client
// @route   POST /api/clients/:id/expenses
exports.addClientExpense = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const {
      expenseType = 'material',
      materialId,
      materialName,
      category,
      quantity,
      unit,
      unitPrice,
      transportIncluded,
      transportCost,
      supplier,
      vehicleNo,
      title,
      totalAmount,
      date,
      paymentMode,
      note
    } = req.body;

    let billImage = '';
    if (req.files && (req.files.billImage || req.files.billFile)) {
      const file = (req.files.billImage || req.files.billFile)[0];
      billImage = publicUploadPath('expenses', file.filename);
    } else if (req.body.billImage) {
      billImage = req.body.billImage;
    }

    let calculatedTotal = 0;
    let finalMaterialCost = 0;
    let finalTransportCost = 0;
    let finalMaterialName = materialName || '';
    let finalCategory = category || 'General';
    let finalUnit = unit || 'Piece';

    let parsedQty = Number(quantity) || 1;
    let parsedRate = Number(unitPrice) || 0;

    if (expenseType === 'material') {
      // If materialId provided, fetch details from master Material
      if (materialId) {
        const mat = await Material.findOne({ _id: materialId, isDeleted: { $ne: true } });
        if (mat) {
          finalMaterialName = materialName || mat.name;
          finalCategory = category || mat.category;
          finalUnit = unit || mat.unit;
        }
      }

      let parsedMaterialCost = Number(req.body.materialCost) || 0;

      // Handle user pricing: Rate per unit vs Total price
      if (parsedMaterialCost > 0 && parsedRate === 0 && parsedQty > 0) {
        parsedRate = Math.round((parsedMaterialCost / parsedQty) * 100) / 100;
      } else if (parsedRate > 0 && parsedMaterialCost === 0 && parsedQty > 0) {
        parsedMaterialCost = Math.round(parsedQty * parsedRate * 100) / 100;
      } else if (parsedRate > 0 && parsedQty > 0) {
        parsedMaterialCost = parsedQty * parsedRate;
      }

      finalMaterialCost = parsedMaterialCost;
      finalTransportCost = transportIncluded === 'true' || transportIncluded === true ? 0 : Number(transportCost) || 0;
      calculatedTotal = finalMaterialCost + finalTransportCost;
    } else {
      // Other expense
      calculatedTotal = Number(totalAmount) || 0;
    }

    // Guard against rapid duplicate clicks / double submission (within last 7 seconds)
    const recentDuplicateExpense = await ClientExpense.findOne({
      clientId: client._id,
      expenseType,
      totalAmount: calculatedTotal,
      isDeleted: { $ne: true },
      createdAt: { $gte: new Date(Date.now() - 7000) }
    });

    if (recentDuplicateExpense) {
      return res.status(200).json({
        success: true,
        message: 'Expense already recorded (duplicate prevented)',
        data: recentDuplicateExpense,
        duplicatePrevented: true
      });
    }

    const expense = await ClientExpense.create({
      clientId: client._id,
      expenseType,
      materialId: materialId || undefined,
      materialName: finalMaterialName,
      category: finalCategory,
      quantity: parsedQty,
      unit: finalUnit,
      unitPrice: parsedRate,
      materialCost: finalMaterialCost,
      transportIncluded: transportIncluded === 'true' || transportIncluded === true,
      transportCost: finalTransportCost,
      supplier: (supplier || '').trim(),
      vehicleNo: (vehicleNo || '').trim(),
      title: (title || '').trim(),
      totalAmount: calculatedTotal,
      date: date ? new Date(date) : new Date(),
      paymentMode: paymentMode || 'Cash',
      note: (note || '').trim(),
      billImage
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error adding client expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: error.message
    });
  }
};

// @desc    Soft-delete client expense
// @route   DELETE /api/clients/:id/expenses/:expenseId
exports.deleteClientExpense = async (req, res) => {
  try {
    const expense = await ClientExpense.findOne({
      _id: req.params.expenseId,
      clientId: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    // Soft delete: flag record as deleted
    expense.isDeleted = true;
    expense.deletedAt = new Date();
    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense soft-deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// @desc    Restore soft-deleted client expense
// @route   PUT /api/clients/:id/expenses/:expenseId/restore
exports.restoreClientExpense = async (req, res) => {
  try {
    const expense = await ClientExpense.findOne({
      _id: req.params.expenseId,
      clientId: req.params.id,
      isDeleted: true
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Soft-deleted expense record not found'
      });
    }

    expense.isDeleted = false;
    expense.deletedAt = undefined;
    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense restored successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error restoring expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore expense',
      error: error.message
    });
  }
};

// @desc    Resend client portal login credentials via email
// @route   POST /api/clients/:id/resend-credentials
exports.resendClientCredentials = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.email) {
      return res.status(400).json({
        success: false,
        message: 'Client does not have an email address. Please update client email first.'
      });
    }

    const clientPassword = client.loginPassword || generateClientPassword(client.name);

    // Ensure User account exists or update password
    let clientUser = await User.findOne({
      $or: [
        { email: client.email.toLowerCase() },
        ...(client.phone ? [{ mobile: client.phone }] : [])
      ]
    });

    if (clientUser) {
      clientUser.clientId = client._id;
      if (clientUser.role !== 'admin') {
        clientUser.role = 'client';
      }
      clientUser.password = clientPassword;
      await clientUser.save();
    } else {
      clientUser = await User.create({
        name: client.name,
        email: client.email.toLowerCase(),
        mobile: client.phone || undefined,
        password: clientPassword,
        role: 'client',
        clientId: client._id,
        emailVerified: true
      });
    }

    client.user = clientUser._id;
    client.loginPassword = clientPassword;
    await client.save();

    const emailSent = await sendClientWelcomeEmail({
      client,
      loginPassword: clientPassword
    });

    res.status(200).json({
      success: true,
      message: emailSent
        ? `Credentials email successfully sent to ${client.email}`
        : `Password updated to ${clientPassword}, but email delivery failed. Please check SMTP settings.`,
      data: {
        email: client.email,
        password: clientPassword,
        emailSent
      }
    });
  } catch (error) {
    console.error('Error resending credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend credentials',
      error: error.message
    });
  }
};

// @desc    Get current logged in client's project details
// @route   GET /api/clients/portal/me
exports.getMyClientProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const userMobile = (req.user.mobile || req.user.phone || '').trim();
    const cleanMobile = userMobile.replace(/\D/g, '').slice(-10);

    // Find active client by clientId or user ID or email or phone
    let client = null;
    if (req.user.clientId) {
      client = await Client.findOne({ _id: req.user.clientId, isDeleted: { $ne: true } });
    }
    if (!client) {
      client = await Client.findOne({ user: userId, isDeleted: { $ne: true } });
    }
    if (!client && userEmail) {
      client = await Client.findOne({ email: userEmail, isDeleted: { $ne: true } });
    }
    if (!client && cleanMobile) {
      client = await Client.findOne({
        phone: { $regex: cleanMobile },
        isDeleted: { $ne: true }
      });
    }

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'No construction project found linked to your account. Please contact administrator.'
      });
    }

    // Auto-link client.user if not already set
    if (!client.user) {
      client.user = userId;
      await client.save().catch(() => {});
    }

    // Populate categories and services
    await client.populate('categories', 'name slug emoji icon image');
    await client.populate({
      path: 'services',
      select: 'name title category price heroImage categoryId',
      populate: { path: 'categoryId', select: 'name emoji icon' }
    });

    // Fetch active payments
    const payments = await ClientPayment.find({ clientId: client._id, isDeleted: { $ne: true } }).sort({ date: -1, createdAt: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingBalance = Math.max(0, (client.contractAmount || 0) - totalPaid);

    // Fetch active expenses / materials
    const allExpenses = await ClientExpense.find({ clientId: client._id, isDeleted: { $ne: true } }).sort({ date: -1 });
    const materialExpenses = allExpenses.filter((e) => e.expenseType === 'material');

    // Group materials summary (e.g. Total Trucks, Total Litres, Total Bags)
    const materialSummary = {};
    materialExpenses.forEach((exp) => {
      const unit = exp.unit || 'Piece';
      if (!materialSummary[unit]) {
        materialSummary[unit] = 0;
      }
      materialSummary[unit] += Number(exp.quantity || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        client: {
          ...client.toObject(),
          progressPercentage: client.progressPercentage
        },
        financials: {
          contractAmount: client.contractAmount || 0,
          serviceRate: client.serviceRate || 0,
          serviceRateUnit: client.serviceRateUnit || '',
          totalPaid,
          remainingBalance,
          paymentCount: payments.length
        },
        steps: client.steps || [],
        payments,
        materialDeliveries: materialExpenses,
        materialSummary
      }
    });
  } catch (error) {
    console.error('Error fetching client portal project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load project details',
      error: error.message
    });
  }
};

// @desc    Add on-site photo or video to client project
// @route   POST /api/clients/:id/media
// @access  Private (Admin)
exports.addSiteMedia = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const uploadedFiles = [];
    if (req.files) {
      Object.values(req.files).forEach((arr) => {
        if (Array.isArray(arr)) {
          uploadedFiles.push(...arr);
        }
      });
    } else if (req.file) {
      uploadedFiles.push(req.file);
    }

    if (!client.siteMedia) {
      client.siteMedia = [];
    }

    const addedItems = [];

    if (uploadedFiles.length > 0) {
      for (const f of uploadedFiles) {
        const mediaUrl = publicUploadPath('site-media', f.filename);
        const isVideo = f.mimetype && f.mimetype.startsWith('video/');
        const mediaType = isVideo ? 'video' : (req.body.mediaType || 'image');
        const item = {
          url: mediaUrl,
          mediaType,
          title: (req.body.title || f.originalname.replace(/\.[^/.]+$/, '')).trim(),
          stepTitle: (req.body.stepTitle || '').trim(),
          caption: (req.body.caption || '').trim(),
          uploadedBy: req.user ? req.user.id : undefined,
          createdAt: new Date()
        };
        client.siteMedia.push(item);
        addedItems.push(item);
      }
    } else if (req.body.url || req.body.mediaUrl) {
      const mediaUrl = req.body.url || req.body.mediaUrl;
      const mediaType = req.body.mediaType || 'image';
      const item = {
        url: mediaUrl,
        mediaType,
        title: (req.body.title || '').trim(),
        stepTitle: (req.body.stepTitle || '').trim(),
        caption: (req.body.caption || '').trim(),
        uploadedBy: req.user ? req.user.id : undefined,
        createdAt: new Date()
      };
      client.siteMedia.push(item);
      addedItems.push(item);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image or video file to upload'
      });
    }

    await client.save();

    res.status(201).json({
      success: true,
      message: `${addedItems.length} site media file(s) uploaded successfully`,
      data: addedItems.length === 1 ? addedItems[0] : addedItems,
      siteMedia: client.siteMedia
    });
  } catch (error) {
    console.error('Error adding site media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload site media',
      error: error.message
    });
  }
};

// @desc    Delete on-site photo or video
// @route   DELETE /api/clients/:id/media/:mediaId
// @access  Private (Admin)
exports.deleteSiteMedia = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    client.siteMedia = (client.siteMedia || []).filter(
      (m) => m._id.toString() !== req.params.mediaId
    );

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Site media deleted successfully',
      siteMedia: client.siteMedia
    });
  } catch (error) {
    console.error('Error deleting site media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete site media',
      error: error.message
    });
  }
};


