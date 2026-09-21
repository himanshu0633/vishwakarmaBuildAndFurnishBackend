const Material = require('../models/Material');

// Default starter materials for construction and interiors
const DEFAULT_MATERIALS = [
  { name: 'UltraTech Cement 50kg', category: 'Civil & Masonry', unit: 'Bag', defaultPrice: 380, defaultSupplier: 'Sharma Building Materials' },
  { name: 'Shree Cement 50kg', category: 'Civil & Masonry', unit: 'Bag', defaultPrice: 360, defaultSupplier: 'Local Cement Store' },
  { name: 'Jindal TMT 550D Saria (12mm)', category: 'Steel & Iron', unit: 'Quintal', defaultPrice: 5800, defaultSupplier: 'Jindal Steel Depot' },
  { name: 'Jindal TMT 550D Saria (10mm)', category: 'Steel & Iron', unit: 'Quintal', defaultPrice: 5900, defaultSupplier: 'Jindal Steel Depot' },
  { name: 'Jindal TMT 550D Saria (16mm)', category: 'Steel & Iron', unit: 'Quintal', defaultPrice: 5800, defaultSupplier: 'Jindal Steel Depot' },
  { name: 'Red Clay Bricks (A-Grade Lal Int)', category: 'Civil & Masonry', unit: 'Piece', defaultPrice: 7.5, defaultSupplier: 'Dadri Bhatta Co.' },
  { name: 'River Sand / Reti (Fine)', category: 'Civil & Masonry', unit: 'Trolley', defaultPrice: 4200, defaultSupplier: 'Mining Sand Transport' },
  { name: 'Stone Dust / Crusher Rori (20mm)', category: 'Civil & Masonry', unit: 'Trolley', defaultPrice: 3800, defaultSupplier: 'Crusher Zone' },
  { name: 'Sintex Overhead Water Tank 1000L', category: 'Plumbing', unit: 'Piece', defaultPrice: 6500, defaultSupplier: 'Pawan Sanitary Store' },
  { name: 'Astral CPVC Pipes 1 inch', category: 'Plumbing', unit: 'Piece', defaultPrice: 450, defaultSupplier: 'Pawan Sanitary Store' },
  { name: 'Finolex FRLS Copper Wire 2.5 sq mm', category: 'Electrical', unit: 'Bundle', defaultPrice: 2200, defaultSupplier: 'Gupta Electricals' },
  { name: 'Kajaria Floor Tiles (2x2 Vitrified)', category: 'Tiles & Stone', unit: 'Box', defaultPrice: 680, defaultSupplier: 'Kajaria Gallery' },
  { name: 'Asian Paints Apex Ultima White 20L', category: 'Paint & Putty', unit: 'Litre', defaultPrice: 6200, defaultSupplier: 'Dadri Paint Center' },
  { name: 'Birla White Wall Putty 40kg', category: 'Paint & Putty', unit: 'Bag', defaultPrice: 850, defaultSupplier: 'Dadri Paint Center' },
  { name: 'Century Ply 19mm Waterproof Board', category: 'Wood & Ply', unit: 'Sq.Ft', defaultPrice: 110, defaultSupplier: 'Timber & Ply Market' },
  { name: 'Greenply 12mm Commercial Ply', category: 'Wood & Ply', unit: 'Sq.Ft', defaultPrice: 75, defaultSupplier: 'Timber & Ply Market' }
];

// @desc    Get all materials (with optional category & search filter)
// @route   GET /api/materials
exports.getAllMaterials = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isActive: { $ne: false }, isDeleted: { $ne: true } };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    let materials = await Material.find(query).sort({ category: 1, name: 1 });

    // If database is completely empty, seed default materials once
    if (materials.length === 0 && !search && (!category || category === 'All')) {
      materials = await Material.insertMany(DEFAULT_MATERIALS);
    }

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
};

// @desc    Create new material
// @route   POST /api/materials
exports.createMaterial = async (req, res) => {
  try {
    const { name, category, unit, defaultPrice, defaultSupplier, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Material name is required'
      });
    }

    const material = await Material.create({
      name: name.trim(),
      category: category || 'Civil & Masonry',
      unit: unit || 'Piece',
      defaultPrice: Number(defaultPrice) || 0,
      defaultSupplier: (defaultSupplier || '').trim(),
      notes: (notes || '').trim()
    });

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create material',
      error: error.message
    });
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
exports.updateMaterial = async (req, res) => {
  try {
    const { name, category, unit, defaultPrice, defaultSupplier, notes } = req.body;

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    if (name) material.name = name.trim();
    if (category) material.category = category;
    if (unit) material.unit = unit;
    if (defaultPrice !== undefined) material.defaultPrice = Number(defaultPrice) || 0;
    if (defaultSupplier !== undefined) material.defaultSupplier = defaultSupplier.trim();
    if (notes !== undefined) material.notes = notes.trim();

    await material.save();

    res.status(200).json({
      success: true,
      message: 'Material updated successfully',
      data: material
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material',
      error: error.message
    });
  }
};

// @desc    Soft-delete material
// @route   DELETE /api/materials/:id
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    material.isDeleted = true;
    material.isActive = false;
    material.deletedAt = new Date();
    await material.save();

    res.status(200).json({
      success: true,
      message: 'Material soft-deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material',
      error: error.message
    });
  }
};

// @desc    Restore soft-deleted material
// @route   PUT /api/materials/:id/restore
exports.restoreMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({ _id: req.params.id, isDeleted: true });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Soft-deleted material not found'
      });
    }

    material.isDeleted = false;
    material.isActive = true;
    material.deletedAt = undefined;
    await material.save();

    res.status(200).json({
      success: true,
      message: 'Material restored successfully',
      data: material
    });
  } catch (error) {
    console.error('Error restoring material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore material',
      error: error.message
    });
  }
};
