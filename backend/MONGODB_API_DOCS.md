# MongoDB Search & Filter API Documentation

## Overview

This API provides a comprehensive search and filter interface for medication experience posts stored in MongoDB. It supports:

- ✅ Full-text search by drug name
- ✅ Multiple filters (different from package, frequency, etc.)
- ✅ Pagination with configurable page sizes
- ✅ Sorting by creation date (newest first)
- ✅ Advanced filtering with complex queries
- ✅ Statistics aggregation

---

## Document Structure

Each post document in MongoDB has this structure:

```javascript
{
  _id: ObjectId("..."),
  drugName: "Ibuprofen",
  userInfo: {
    gender: "female",
    menstrualPhase: true
  },
  dosage: {
    amount: 200,          // numeric value
    unit: "mg",           // string
    times: 1,             // numeric
    frequency: "twice daily"  // string
  },
  duration: "1 week",
  expectedEffect: true,
  differentFromPackage: true,
  reactionDescription: "Caused mild stomach upset",
  additionalInfo: {
    longTermUse: false,
    pregnant: false,
    notes: "Took with food"
  },
  createdAt: ISODate("2026-03-07T10:30:00Z")
}
```

---

## Endpoints

### 1. GET /posts - Basic Search & Filter

**Description:** Search and filter posts with pagination

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in drugName (case-insensitive) | `search=aspirin` |
| `differentFromPackage` | boolean | Filter by different from package | `differentFromPackage=true` |
| `frequency` | string | Filter by dosage frequency | `frequency=twice%20daily` |
| `page` | number | Page number (default: 1) | `page=1` |
| `limit` | number | Items per page, max 100 (default: 10) | `limit=20` |

**Examples:**

```bash
# Basic search
GET /posts?search=aspirin&page=1&limit=10

# Filter by different from package
GET /posts?differentFromPackage=true

# Search + filter
GET /posts?search=ibuprofen&differentFromPackage=true&page=1

# Filter by frequency
GET /posts?frequency=twice%20daily&limit=20

# Pagination
GET /posts?page=2&limit=15
```

**Response:**

```json
{
  "success": true,
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "drugName": "Aspirin",
      "dosage": {
        "amount": 500,
        "unit": "mg",
        "times": 1,
        "frequency": "twice daily"
      },
      "differentFromPackage": false,
      "reactionDescription": "Works well for headaches",
      "createdAt": "2026-03-07T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. GET /posts/advanced - Advanced Multi-Filter Search

**Description:** Complex search with multiple filters

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `drugName` | string | Search drug name |
| `minAmount` | number | Minimum dosage amount |
| `maxAmount` | number | Maximum dosage amount |
| `unit` | string | Dosage unit (mg, ml, etc.) |
| `gender` | string | User gender (female, male, other) |
| `menstrualPhase` | boolean | Filter by menstrual phase (true/false) |
| `expectedEffect` | boolean | Filter by expected effect (true/false) |
| `differentFromPackage` | boolean | Filter by different from package |
| `longTermUse` | boolean | Filter by long-term use (true/false) |
| `sortBy` | string | Sort field: createdAt or drugName |
| `sortOrder` | string | asc or desc (default: desc) |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Examples:**

```bash
# Find high-dose posts
GET /posts/advanced?minAmount=500&maxAmount=1000&unit=mg

# Female-specific experiences
GET /posts/advanced?gender=female&menstrualPhase=true

# Posts that differ from package + expected effect
GET /posts/advanced?differentFromPackage=true&expectedEffect=false

# Long-term use cases
GET /posts/advanced?longTermUse=true&sortOrder=desc

# Complex query
GET /posts/advanced?drugName=ibuprofen&minAmount=200&maxAmount=400&expectedEffect=true&longTermUse=false&page=1&limit=10

# Sort by drug name ascending
GET /posts/advanced?sortBy=drugName&sortOrder=asc
```

**Response:** Same as basic /posts endpoint

---

### 3. GET /posts/stats - Statistics

**Description:** Get aggregated statistics about all posts

**Example:**

```bash
GET /posts/stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "total": [
      {
        "count": 150
      }
    ],
    "differentFromPackage": [
      {
        "count": 45
      }
    ],
    "byFrequency": [
      {
        "_id": "twice daily",
        "count": 52
      },
      {
        "_id": "once daily",
        "count": 38
      },
      {
        "_id": "as needed",
        "count": 30
      }
    ],
    "byDrug": [
      {
        "_id": "Aspirin",
        "count": 28
      },
      {
        "_id": "Ibuprofen",
        "count": 22
      }
    ],
    "averageDosage": [
      {
        "_id": "mg",
        "avgAmount": 445.5
      }
    ]
  }
}
```

---

### 4. GET /posts/:id - Get Single Post

**Description:** Retrieve a specific post by MongoDB _id

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB ObjectId |

**Example:**

```bash
GET /posts/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "post": {
    "_id": "507f1f77bcf86cd799439011",
    "drugName": "Ibuprofen",
    "userInfo": {
      "gender": "female",
      "menstrualPhase": true
    },
    "dosage": {
      "amount": 200,
      "unit": "mg",
      "times": 1,
      "frequency": "twice daily"
    },
    "duration": "1 week",
    "expectedEffect": true,
    "differentFromPackage": true,
    "reactionDescription": "Caused mild stomach upset",
    "additionalInfo": {
      "longTermUse": false,
      "pregnant": false,
      "notes": "Took with food"
    },
    "createdAt": "2026-03-07T10:30:00Z"
  }
}
```

---

## Usage Examples

### cURL Examples

```bash
# Search for aspirin
curl "http://localhost:5000/posts?search=aspirin"

# Get posts that differ from package
curl "http://localhost:5000/posts?differentFromPackage=true&limit=20"

# Search with frequency filter
curl "http://localhost:5000/posts?search=ibuprofen&frequency=twice%20daily&page=1&limit=10"

# Advanced: Female experiences during menstrual phase
curl "http://localhost:5000/posts/advanced?gender=female&menstrualPhase=true"

# Advanced: High dosages (500-1000mg)
curl "http://localhost:5000/posts/advanced?minAmount=500&maxAmount=1000&unit=mg"

# Get statistics
curl "http://localhost:5000/posts/stats"

# Get single post
curl "http://localhost:5000/posts/507f1f77bcf86cd799439011"
```

### JavaScript/Node.js Examples

```javascript
// Search for aspirin
const response = await fetch('http://localhost:5000/posts?search=aspirin');
const data = await response.json();
console.log(data.posts);

// Advanced search: Female during menstrual phase
const response = await fetch(
  'http://localhost:5000/posts/advanced?gender=female&menstrualPhase=true'
);
const data = await response.json();

// Pagination
async function getPosts(page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:5000/posts?page=${page}&limit=${limit}`
  );
  return response.json();
}

// Search with multiple filters
const response = await fetch(
  'http://localhost:5000/posts/advanced?drugName=ibuprofen&differentFromPackage=true&expectedEffect=false&page=1&limit=10'
);
const data = await response.json();
```

---

## MongoDB Indexes

For optimal query performance, create these indexes:

```javascript
// In MongoDB shell or Atlas
db.posts.createIndex({ drugName: 1 });
db.posts.createIndex({ createdAt: -1 });
db.posts.createIndex({ differentFromPackage: 1 });
db.posts.createIndex({ 'dosage.frequency': 1 });
db.posts.createIndex({ 'userInfo.gender': 1 });
db.posts.createIndex({ 'additionalInfo.longTermUse': 1 });

// Compound indexes for common queries
db.posts.createIndex({ differentFromPackage: 1, createdAt: -1 });
db.posts.createIndex({ drugName: 1, createdAt: -1 });
db.posts.createIndex({ 'dosage.frequency': 1, createdAt: -1 });
```

---

## Search Features

### Case-Insensitive Search

The API uses MongoDB regex with `$options: 'i'` for case-insensitive searching:

- `search=aspirin` finds "Aspirin", "ASPIRIN", "aSPiRin"
- `frequency=twice%20daily` finds "Twice Daily", "TWICE DAILY"

### Pagination

```
page = 1, limit = 10 → skip 0 items
page = 2, limit = 10 → skip 10 items
page = 3, limit = 10 → skip 20 items
```

### Sorting

- Default: `createdAt: -1` (newest first)
- Advanced: Can sort by `drugName` ascending/descending

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid post ID"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Post not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to fetch posts",
  "details": "MongoDB connection error"
}
```

---

## Performance Tips

1. **Use filters** - Narrow down results with differentFromPackage, frequency, etc.
2. **Limit results** - Use smaller limit values for faster responses
3. **Pagination** - Avoid large page jumps
4. **Indexes** - Create MongoDB indexes on frequently searched fields
5. **Caching** - Cache /stats endpoint results

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install express cors dotenv mongodb
```

### 2. Set Environment Variables

Create `.env` file:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/medication_forum
PORT=5000
```

### 3. Start Server

```bash
node server-mongodb.js
```

### 4. Test Endpoints

```bash
curl http://localhost:5000/posts?search=aspirin
```

---

## Limitations

- Maximum `limit` is 100 items per page
- MongoDB ObjectId required for single post retrieval
- Minimum page is 1
- Search is limited to drugName and dosage.frequency
- Advanced search limited to indexed fields

---

## Future Improvements

- [ ] Full-text search index on reactionDescription
- [ ] Geolocation filtering
- [ ] Rating/review system
- [ ] User authentication
- [ ] Favorite/bookmark posts
- [ ] Comment threads
- [ ] Real-time notifications
