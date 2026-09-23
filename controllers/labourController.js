const LabourWorker = require('../models/LabourWorker');
const LabourAttendance = require('../models/LabourAttendance');
const LabourPayment = require('../models/LabourPayment');
const Client = require('../models/Client');

// Helper to format currency for WhatsApp
const formatINR = (val) => Number(val || 0).toLocaleString('en-IN');

// Helper to generate WhatsApp receipt message
const generateWhatsAppReceiptText = ({
  clientName,
  location,
  labourName,
  role,
  amount,
  date,
  paymentMode,
  notes,
  totalDays,
  totalEarned,
  totalPaid,
  balanceDue
}) => {
  const d = new Date(date || Date.now());
  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const roleHindi =
    role === 'mistri'
      ? 'कारीगर / मिस्त्री'
      : role === 'thekedar'
      ? 'ठेकेदार'
      : role === 'carpenter'
      ? 'बढ़ई'
      : role === 'plumber'
      ? 'प्लंबर'
      : role === 'electrician'
      ? 'इलेक्ट्रीशियन'
      : role === 'painter'
      ? 'पेंटर'
      : role === 'helper'
      ? 'हेल्पर'
      : 'मजदूर';

  let msg = `*VISHWAKARMA BUILD & FURNISH*\n`;
  msg += `*मजदूरी भुगतान रसीद (WAGE PAYMENT RECEIPT)*\n`;
  msg += `--------------------------------\n`;
  msg += `👷 *कारीगर/मजदूर:* ${labourName} (${roleHindi})\n`;
  msg += `📍 *साइट:* ${clientName || 'Site'}${location ? ` - ${location}` : ''}\n`;
  msg += `📅 *तारीख:* ${dateStr} | ⏰ *समय:* ${timeStr}\n\n`;

  msg += `💰 *प्राप्त राशि:* ₹ ${formatINR(amount)}\n`;
  msg += `💳 *भुगतान माध्यम:* ${paymentMode || 'Cash'}\n`;
  if (notes) {
    msg += `📝 *विवरण/नोट:* ${notes}\n`;
  }
  msg += `--------------------------------\n`;
  msg += `📊 *वर्तमान हिसाब-किताब (LEDGER):*\n`;
  msg += `• कुल हाजिरी: *${totalDays || 0} दिन*\n`;
  msg += `• कुल बनी मजदूरी: *₹ ${formatINR(totalEarned)}*\n`;
  msg += `• अब तक कुल भुगतान: *₹ ${formatINR(totalPaid)}*\n`;
  if (balanceDue > 0) {
    msg += `• ⚠️ *शेष बकाया राशि:* *₹ ${formatINR(balanceDue)}*\n`;
  } else if (balanceDue < 0) {
    msg += `• ℹ️ *अग्रिम भुगतान (Advance):* *₹ ${formatINR(Math.abs(balanceDue))}*\n`;
  } else {
    msg += `• ✅ *हिसाब चुकता:* *₹ 0 (No Dues)*\n`;
  }
  msg += `--------------------------------\n`;
  msg += `विश्वकर्मा बिल्ड एंड फर्निश - चरखी दादरी, हरियाणा\n`;
  msg += `📞 हेल्पलाइन: +91 9416856468 / +91 9812739343`;

  return msg;
};

// @desc    Get all labourers for a client project with aggregated totals
// @route   GET /api/clients/:id/labour
// @access  Private (Admin)
exports.getProjectLabourers = async (req, res) => {
  try {
    const { id: clientId } = req.params;

    const client = await Client.findOne({ _id: clientId, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client project not found'
      });
    }

    const workers = await LabourWorker.find({ clientId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Aggregate attendance per worker
    const attendanceAgg = await LabourAttendance.aggregate([
      { $match: { clientId: client._id, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$labourId',
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          halfDayCount: { $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          totalUnits: { $sum: '$units' },
          totalOvertimeWage: { $sum: '$overtimeWage' }
        }
      }
    ]);

    const attendanceMap = {};
    attendanceAgg.forEach((a) => {
      attendanceMap[a._id.toString()] = a;
    });

    // Aggregate payments per worker
    const paymentsAgg = await LabourPayment.aggregate([
      { $match: { clientId: client._id, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$labourId',
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    const paymentsMap = {};
    paymentsAgg.forEach((p) => {
      paymentsMap[p._id.toString()] = p;
    });

    let overallTotalWageEarned = 0;
    let overallTotalPaid = 0;
    let overallTotalHaziriUnits = 0;

    const workersWithStats = workers.map((w) => {
      const wId = w._id.toString();
      const att = attendanceMap[wId] || {
        presentCount: 0,
        halfDayCount: 0,
        absentCount: 0,
        totalUnits: 0,
        totalOvertimeWage: 0
      };
      const pay = paymentsMap[wId] || {
        totalPaid: 0,
        paymentCount: 0
      };

      const dailyWage = Number(w.dailyWage || 0);
      const totalUnits = Number(att.totalUnits || 0);
      const overtimeWage = Number(att.totalOvertimeWage || 0);
      const totalWageEarned = Math.round((totalUnits * dailyWage) + overtimeWage);
      const totalPaid = Number(pay.totalPaid || 0);
      const balanceDue = totalWageEarned - totalPaid;

      overallTotalWageEarned += totalWageEarned;
      overallTotalPaid += totalPaid;
      overallTotalHaziriUnits += totalUnits;

      return {
        ...w.toObject(),
        totalDays: totalUnits,
        totalWageEarned,
        totalPaid,
        balanceDue,
        attendance: {
          present: att.presentCount,
          halfDay: att.halfDayCount,
          absent: att.absentCount,
          totalUnits: att.totalUnits,
          overtimeWage: att.totalOvertimeWage
        },
        financials: {
          totalDays: totalUnits,
          totalWageEarned,
          totalPaid,
          balanceDue,
          paymentCount: pay.paymentCount
        }
      };
    });

    const overallBalanceDue = overallTotalWageEarned - overallTotalPaid;

    const summaryObj = {
      totalWorkers: workers.length,
      totalLabourers: workers.length,
      activeWorkers: workers.filter((w) => w.status === 'active').length,
      totalHaziriUnits: overallTotalHaziriUnits,
      totalDaysWorked: overallTotalHaziriUnits,
      totalWageEarned: overallTotalWageEarned,
      totalPaid: overallTotalPaid,
      balanceDue: overallBalanceDue,
      totalBalanceDue: overallBalanceDue
    };

    res.status(200).json({
      success: true,
      data: {
        workers: workersWithStats,
        labourers: workersWithStats,
        summary: summaryObj,
        clientStartDate: client.startDate || client.createdAt
      },
      workers: workersWithStats,
      labourers: workersWithStats,
      summary: summaryObj
    });
  } catch (error) {
    console.error('Error fetching project labourers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch labourers',
      error: error.message
    });
  }
};

// @desc    Add a new labourer/worker for this project
// @route   POST /api/clients/:id/labour
// @access  Private (Admin)
exports.addLabourer = async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const { name, phone, role, dailyWage, startDate, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Labourer / worker name is required'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile phone number is required'
      });
    }

    if (dailyWage === undefined || Number(dailyWage) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid daily wage (दिहाड़ी) is required'
      });
    }

    const client = await Client.findOne({ _id: clientId, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client project not found'
      });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

    // Check if worker already added to this client
    const existing = await LabourWorker.findOne({
      clientId,
      phone: { $regex: new RegExp(cleanPhone.slice(-10) + '$') },
      isDeleted: { $ne: true }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Worker "${existing.name}" is already registered on this project with mobile ${phone}`
      });
    }

    const worker = await LabourWorker.create({
      clientId,
      name: name.trim(),
      phone: cleanPhone,
      role: role || 'mazdoor',
      dailyWage: Number(dailyWage),
      startDate: startDate || client.startDate || client.createdAt || new Date(),
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `${worker.name} successfully registered`,
      data: worker
    });
  } catch (error) {
    console.error('Error adding labourer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add labourer',
      error: error.message
    });
  }
};

// @desc    Update labourer details
// @route   PUT /api/clients/:id/labour/:labourId
// @access  Private (Admin)
exports.updateLabourer = async (req, res) => {
  try {
    const { id: clientId, labourId } = req.params;
    const { name, phone, role, dailyWage, status, notes } = req.body;

    const worker = await LabourWorker.findOne({ _id: labourId, clientId, isDeleted: { $ne: true } });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    if (name) worker.name = name.trim();
    if (phone) worker.phone = phone.trim().replace(/[^0-9]/g, '');
    if (role) worker.role = role;
    if (dailyWage !== undefined) worker.dailyWage = Number(dailyWage);
    if (status) worker.status = status;
    if (notes !== undefined) worker.notes = notes;

    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Worker details updated',
      data: worker
    });
  } catch (error) {
    console.error('Error updating labourer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worker',
      error: error.message
    });
  }
};

// @desc    Soft delete labourer
// @route   DELETE /api/clients/:id/labour/:labourId
// @access  Private (Admin)
exports.deleteLabourer = async (req, res) => {
  try {
    const { id: clientId, labourId } = req.params;

    const worker = await LabourWorker.findOne({ _id: labourId, clientId, isDeleted: { $ne: true } });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.isDeleted = true;
    worker.deletedAt = new Date();
    await worker.save();

    res.status(200).json({
      success: true,
      message: `Worker "${worker.name}" removed from project`
    });
  } catch (error) {
    console.error('Error deleting labourer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove worker',
      error: error.message
    });
  }
};

// @desc    Get attendance for a specific date (YYYY-MM-DD)
// @route   GET /api/clients/:id/labour/attendance
// @access  Private (Admin)
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const { date } = req.query;

    const targetDate = date || new Date().toISOString().split('T')[0];

    const workers = await LabourWorker.find({
      clientId,
      isDeleted: { $ne: true }
    }).sort({ name: 1 });

    const attendanceRecords = await LabourAttendance.find({
      clientId,
      date: targetDate,
      isDeleted: { $ne: true }
    });

    const recordMap = {};
    attendanceRecords.forEach((r) => {
      recordMap[r.labourId.toString()] = r;
    });

    const result = workers.map((w) => {
      const record = recordMap[w._id.toString()] || null;
      return {
        labourId: w._id,
        name: w.name,
        phone: w.phone,
        role: w.role,
        dailyWage: w.dailyWage,
        status: record ? record.status : 'unmarked',
        units: record ? record.units : 0,
        overtimeHours: record ? record.overtimeHours : 0,
        overtimeWage: record ? record.overtimeWage : 0,
        note: record ? record.note : ''
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      data: {
        date: targetDate,
        records: result
      },
      records: result
    });
  } catch (error) {
    console.error('Error fetching date attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

// @desc    Save daily attendance records for multiple workers
// @route   POST /api/clients/:id/labour/attendance
// @access  Private (Admin)
exports.saveDailyAttendance = async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const { date, records, attendance } = req.body;
    const listToSave = records || attendance || [];

    if (!date || !Array.isArray(listToSave)) {
      return res.status(400).json({
        success: false,
        message: 'Date and records array are required'
      });
    }

    const client = await Client.findOne({ _id: clientId, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client project not found'
      });
    }

    const bulkOps = listToSave.map((rec) => {
      const units = rec.status === 'present' ? 1.0 : rec.status === 'half_day' ? 0.5 : 0.0;
      return {
        updateOne: {
          filter: { clientId, labourId: rec.labourId, date },
          update: {
            $set: {
              status: rec.status,
              units,
              overtimeHours: Number(rec.overtimeHours) || 0,
              overtimeWage: Number(rec.overtimeWage) || 0,
              note: rec.note || '',
              isDeleted: false
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await LabourAttendance.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: `Attendance saved for date ${date}`
    });
  } catch (error) {
    console.error('Error saving daily attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save attendance',
      error: error.message
    });
  }
};

// @desc    Get all labour payments for a project
// @route   GET /api/clients/:id/labour/payments
// @access  Private (Admin)
exports.getLabourPayments = async (req, res) => {
  try {
    const { id: clientId } = req.params;

    const payments = await LabourPayment.find({ clientId, isDeleted: { $ne: true } })
      .populate('labourId', 'name phone role dailyWage')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        payments,
        total: payments.length
      },
      payments
    });
  } catch (error) {
    console.error('Error fetching labour payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch labour payments',
      error: error.message
    });
  }
};

// @desc    Record a payment to a labourer and generate WhatsApp receipt text
// @route   POST /api/clients/:id/labour/payments
// @access  Private (Admin)
exports.addLabourPayment = async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const { labourId, amount, date, paymentMode, transactionRef, notes } = req.body;

    if (!labourId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a labourer/worker'
      });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid payment amount'
      });
    }

    const client = await Client.findOne({ _id: clientId, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client project not found'
      });
    }

    const worker = await LabourWorker.findOne({ _id: labourId, clientId, isDeleted: { $ne: true } });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // 7-second rapid double-click guard
    const sevenSecondsAgo = new Date(Date.now() - 7000);
    const duplicate = await LabourPayment.findOne({
      clientId,
      labourId,
      amount: numAmount,
      createdAt: { $gte: sevenSecondsAgo },
      isDeleted: { $ne: true }
    });

    if (duplicate) {
      return res.status(200).json({
        success: true,
        message: 'Payment already recorded (duplicate prevented)',
        data: duplicate,
        duplicatePrevented: true
      });
    }

    const paymentDate = date ? new Date(date) : new Date();

    const payment = await LabourPayment.create({
      clientId,
      labourId,
      amount: numAmount,
      date: paymentDate,
      paymentMode: paymentMode || 'Cash',
      transactionRef: transactionRef || '',
      notes: notes || ''
    });

    // Calculate updated worker ledger stats for WhatsApp receipt
    const attendanceAgg = await LabourAttendance.aggregate([
      { $match: { clientId: client._id, labourId: worker._id, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$units' },
          totalOvertimeWage: { $sum: '$overtimeWage' }
        }
      }
    ]);

    const totalUnits = attendanceAgg[0]?.totalUnits || 0;
    const totalOvertimeWage = attendanceAgg[0]?.totalOvertimeWage || 0;
    const totalWageEarned = Math.round((totalUnits * Number(worker.dailyWage || 0)) + totalOvertimeWage);

    const paymentsAgg = await LabourPayment.aggregate([
      { $match: { clientId: client._id, labourId: worker._id, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' }
        }
      }
    ]);

    const totalPaid = paymentsAgg[0]?.totalPaid || 0;
    const balanceDue = totalWageEarned - totalPaid;

    const cleanPhone = (worker.phone || '').replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;

    const whatsappText = generateWhatsAppReceiptText({
      clientName: client.name,
      location: client.location,
      labourName: worker.name,
      role: worker.role,
      amount: numAmount,
      date: paymentDate,
      paymentMode: payment.paymentMode,
      notes: payment.notes,
      totalDays: totalUnits,
      totalEarned: totalWageEarned,
      totalPaid,
      balanceDue
    });

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappText)}`;

    res.status(201).json({
      success: true,
      message: `Payment of ₹ ${formatINR(numAmount)} recorded for ${worker.name}`,
      data: payment,
      whatsapp: {
        phone: formattedPhone,
        text: whatsappText,
        url: whatsappUrl
      },
      stats: {
        totalUnits,
        totalWageEarned,
        totalPaid,
        balanceDue
      }
    });
  } catch (error) {
    console.error('Error adding labour payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// @desc    Soft delete a labour payment
// @route   DELETE /api/clients/:id/labour/payments/:paymentId
// @access  Private (Admin)
exports.deleteLabourPayment = async (req, res) => {
  try {
    const { id: clientId, paymentId } = req.params;

    const payment = await LabourPayment.findOne({ _id: paymentId, clientId, isDeleted: { $ne: true } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.isDeleted = true;
    payment.deletedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting labour payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

// @desc    Get attendance history (all dates, present/absent/half-day) for workers of client
// @route   GET /api/clients/:id/labour/attendance-history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const { labourId } = req.query;

    const query = { clientId, isDeleted: { $ne: true } };
    if (labourId) {
      query.labourId = labourId;
    }

    const records = await LabourAttendance.find(query)
      .populate('labourId', 'name phone role dailyWage')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: records,
      records
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history',
      error: error.message
    });
  }
};
