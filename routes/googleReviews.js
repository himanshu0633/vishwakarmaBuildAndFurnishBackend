const express = require('express');
const axios = require('axios');

const router = express.Router();

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache = {
  expiresAt: 0,
  payload: null
};

const toReview = (review = {}) => ({
  name: review.author_name || 'Google User',
  rating: Number(review.rating) || 5,
  text: review.text || '',
  profilePhotoUrl: review.profile_photo_url || '',
  relativeTime: review.relative_time_description || '',
  time: review.time || null,
  source: 'Google'
});

router.get('/api/google-reviews', async (req, res) => {
  try {
    if (cache.payload && Date.now() < cache.expiresAt) {
      return res.json(cache.payload);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      return res.json({
        success: false,
        message: 'Google reviews are not configured',
        data: [],
        business: null
      });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        key: apiKey,
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,reviews,url'
      },
      timeout: 8000
    });

    if (response.data.status !== 'OK') {
      return res.status(502).json({
        success: false,
        message: response.data.error_message || `Google Places error: ${response.data.status}`,
        data: [],
        business: null
      });
    }

    const place = response.data.result || {};
    const payload = {
      success: true,
      data: (place.reviews || []).map(toReview).filter((review) => review.text),
      business: {
        name: place.name || 'Vishwakarma Build & Furnish',
        rating: Number(place.rating) || null,
        reviewCount: Number(place.user_ratings_total) || 0,
        url: place.url || ''
      }
    };

    cache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload
    };

    return res.json(payload);
  } catch (error) {
    console.error('Google reviews fetch failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Unable to fetch Google reviews right now',
      data: [],
      business: null
    });
  }
});

module.exports = router;
