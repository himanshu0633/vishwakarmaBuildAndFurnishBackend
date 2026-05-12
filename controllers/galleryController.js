const GalleryItem = require('../models/GalleryItem');

const buildPayload = (body = {}, file) => ({
  title: body.title?.trim(),
  category: body.category?.trim() || 'Workshop',
  image: file ? `/${file.path.replace(/\\/g, '/')}` : body.image?.trim(),
  description: body.description?.trim() || '',
  featured: body.featured === 'true' || body.featured === true,
  isActive: body.isActive === undefined ? true : body.isActive === 'true' || body.isActive === true,
  order: Number(body.order) || 0
});

exports.getGalleryItems = async (req, res) => {
  try {
    const query = {};

    if (req.query.includeInactive !== 'true') {
      query.isActive = true;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.featured === 'true') {
      query.featured = true;
    }

    const limit = Math.min(Number(req.query.limit) || 0, 100);
    const galleryQuery = GalleryItem.find(query).sort({ order: 1, createdAt: -1 });

    if (limit) {
      galleryQuery.limit(limit);
    }

    const items = await galleryQuery;

    res.json({
      success: true,
      data: items,
      message: 'Gallery items fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery items',
      error: error.message
    });
  }
};

exports.createGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.create(buildPayload(req.body, req.file));

    res.status(201).json({
      success: true,
      data: item,
      message: 'Gallery item created successfully'
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gallery item',
      error: error.message
    });
  }
};

exports.updateGalleryItem = async (req, res) => {
  try {
    const payload = buildPayload(req.body, req.file);

    if (!payload.image) {
      delete payload.image;
    }

    const item = await GalleryItem.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      data: item,
      message: 'Gallery item updated successfully'
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gallery item',
      error: error.message
    });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      data: item,
      message: 'Gallery item moved to inactive successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting gallery item',
      error: error.message
    });
  }
};
