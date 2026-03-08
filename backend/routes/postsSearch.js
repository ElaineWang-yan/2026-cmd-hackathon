/**
 * Posts Search & Filter API
 * 
 * Endpoint: GET /posts
 * 
 * Query Parameters:
 * - search: Search in drugName (case-insensitive)
 * - differentFromPackage: Filter by boolean (true/false)
 * - frequency: Filter by dosage.frequency
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * Example requests:
 * GET /posts?search=aspirin&page=1&limit=10
 * GET /posts?differentFromPackage=true&frequency=twice%20daily
 * GET /posts?search=ibuprofen&differentFromPackage=true&page=1
 */

const express = require('express');
const router = express.Router();
const { getPostsCollection } = require('../lib/mongoDb');

/**
 * GET /posts
 * Search, filter, paginate, and sort medication experience posts
 */
router.get('/', async (req, res) => {
  try {
    // Get query parameters
    const {
      search = '',
      differentFromPackage,
      frequency,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate and convert types
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build MongoDB query filter
    const filter = {};

    // Search by drugName (case-insensitive)
    if (search && search.trim()) {
      filter.drugName = {
        $regex: search.trim(),
        $options: 'i', // case-insensitive
      };
    }

    // Filter by differentFromPackage
    if (differentFromPackage !== undefined) {
      const isDifferent = differentFromPackage === 'true' || differentFromPackage === true;
      filter.differentFromPackage = isDifferent;
    }

    // Filter by dosage.frequency
    if (frequency && frequency.trim()) {
      filter['dosage.frequency'] = {
        $regex: frequency.trim(),
        $options: 'i', // case-insensitive
      };
    }

    // Get collection
    const postsCollection = await getPostsCollection();

    // Execute query with sorting, skip, and limit
    const posts = await postsCollection
      .find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Get total count for pagination info
    const total = await postsCollection.countDocuments(filter);

    // Return response
    res.status(200).json({
      posts,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('GET /posts error:', error);
    res.status(500).json({
      error: 'Failed to fetch posts',
      details: error.message,
    });
  }
});

/**
 * GET /posts/advanced
 * Advanced search with multiple filters
 * 
 * Query Parameters:
 * - drugName: Search drug name
 * - minAmount: Minimum dosage amount
 * - maxAmount: Maximum dosage amount
 * - unit: Dosage unit (e.g., "mg", "ml")
 * - gender: Filter by gender
 * - menstrualPhase: Filter by menstrual phase (true/false)
 * - expectedEffect: Filter by expected effect (true/false)
 * - differentFromPackage: Filter by different from package (true/false)
 * - longTermUse: Filter by long-term use (true/false)
 * - sortBy: Sort field (createdAt, drugName) - default: createdAt
 * - sortOrder: asc or desc - default: desc
 * - page: Page number
 * - limit: Items per page
 */
router.get('/advanced', async (req, res) => {
  try {
    const {
      drugName,
      minAmount,
      maxAmount,
      unit,
      gender,
      menstrualPhase,
      expectedEffect,
      differentFromPackage,
      longTermUse,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build complex filter
    const filter = {};

    if (drugName) {
      filter.drugName = { $regex: drugName, $options: 'i' };
    }

    if (unit) {
      filter['dosage.unit'] = unit;
    }

    if (minAmount || maxAmount) {
      filter['dosage.amount'] = {};
      if (minAmount) filter['dosage.amount'].$gte = parseInt(minAmount);
      if (maxAmount) filter['dosage.amount'].$lte = parseInt(maxAmount);
    }

    if (gender) {
      filter['userInfo.gender'] = gender;
    }

    if (menstrualPhase !== undefined) {
      filter['userInfo.menstrualPhase'] = menstrualPhase === 'true';
    }

    if (expectedEffect !== undefined) {
      filter.expectedEffect = expectedEffect === 'true';
    }

    if (differentFromPackage !== undefined) {
      filter.differentFromPackage = differentFromPackage === 'true';
    }

    if (longTermUse !== undefined) {
      filter['additionalInfo.longTermUse'] = longTermUse === 'true';
    }

    // Build sort order
    const sortOrder_num = sortOrder === 'asc' ? 1 : -1;
    const sort = {};
    sort[sortBy === 'drugName' ? 'drugName' : 'createdAt'] = sortOrder_num;

    const postsCollection = await getPostsCollection();

    const posts = await postsCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await postsCollection.countDocuments(filter);

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('GET /posts/advanced error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      details: error.message,
    });
  }
});

/**
 * GET /posts/stats
 * Get statistics about posts
 */
router.get('/stats', async (req, res) => {
  try {
    const postsCollection = await getPostsCollection();

    const stats = await postsCollection
      .aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            differentFromPackage: [
              { $match: { differentFromPackage: true } },
              { $count: 'count' },
            ],
            byFrequency: [
              { $group: { _id: '$dosage.frequency', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            byDrug: [
              { $group: { _id: '$drugName', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            averageDosage: [
              { $group: { _id: '$dosage.unit', avgAmount: { $avg: '$dosage.amount' } } },
            ],
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      stats: stats[0],
    });
  } catch (error) {
    console.error('GET /posts/stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      details: error.message,
    });
  }
});

/**
 * GET /posts/:id
 * Get a single post by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID',
      });
    }

    const postsCollection = await getPostsCollection();
    const post = await postsCollection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('GET /posts/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post',
      details: error.message,
    });
  }
});

router.post()

module.exports = router;
