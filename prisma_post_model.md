# Prisma Post Model for Medication Forum

## Model Definition

```prisma
model Post {
  id                    Int       @id @default(autoincrement())
  drugName              String    @db.VarChar(255)
  dosage                String    @db.VarChar(100)
  administrationTime    String    @db.VarChar(100)
  frequency             String    @db.VarChar(100)
  differentFromPackage  Boolean   @default(false)
  reactionDescription   String?   @db.Text
  createdAt             DateTime  @default(now())
  
  // Relations (optional - add later)
  userId                Int?
  user                  User?     @relation(fields: [userId], references: [id])
  comments              Comment[]
  likes                 Like[]
  
  @@index([drugName])
  @@index([userId])
  @@index([createdAt])
}
```

## Field Explanations

| Field | Type | Purpose |
|-------|------|---------|
| **id** | Int | Unique auto-incrementing primary key for each post |
| **drugName** | String | Name of the medication (e.g., "Aspirin", "Ibuprofen") |
| **dosage** | String | Amount taken (e.g., "500mg", "200mg") |
| **administrationTime** | String | When taken (e.g., "Morning", "After meals") |
| **frequency** | String | How often taken (e.g., "Twice daily", "Once daily") |
| **differentFromPackage** | Boolean | Whether experience differs from package warnings (default: false) |
| **reactionDescription** | String | Optional detailed description of the user's experience/reaction |
| **createdAt** | DateTime | Timestamp when post was created (auto-set) |

## Indexes for Search & Filter

The `@@index` annotations optimize queries for:
- **drugName**: Fast searches by medication name
- **userId**: Quick retrieval of user's posts
- **createdAt**: Efficient sorting by date (newest/oldest)

## Usage Examples

### Create a Post
```javascript
const newPost = await prisma.post.create({
  data: {
    drugName: "Aspirin",
    dosage: "500mg",
    administrationTime: "Morning",
    frequency: "Twice daily",
    differentFromPackage: false,
    reactionDescription: "Works well for headaches, minimal side effects",
    userId: 1
  }
});
```

### Search Posts by Drug Name
```javascript
const results = await prisma.post.findMany({
  where: {
    drugName: {
      contains: "aspirin",
      mode: "insensitive" // Case-insensitive search
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

### Filter by Different from Package
```javascript
const differentReactions = await prisma.post.findMany({
  where: {
    differentFromPackage: true
  }
});
```

### Get All Posts (Paginated)
```javascript
const posts = await prisma.post.findMany({
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' }
});
```

## Recommended Schema.prisma Structure

```prisma
datasource db {
  provider = "mongodb"  // or "postgresql", "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  password String
  posts Post[]
  comments Comment[]
  likes Like[]
  createdAt DateTime @default(now())
}

model Post {
  id                    Int       @id @default(autoincrement())
  drugName              String    @db.VarChar(255)
  dosage                String    @db.VarChar(100)
  administrationTime    String    @db.VarChar(100)
  frequency             String    @db.VarChar(100)
  differentFromPackage  Boolean   @default(false)
  reactionDescription   String?   @db.Text
  createdAt             DateTime  @default(now())
  
  userId                Int?
  user                  User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments              Comment[]
  likes                 Like[]
  
  @@index([drugName])
  @@index([userId])
  @@index([createdAt])
}

model Comment {
  id        Int     @id @default(autoincrement())
  content   String  @db.Text
  createdAt DateTime @default(now())
  
  postId    Int
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    Int?
  user      User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([postId])
  @@index([userId])
}

model Like {
  id     Int  @id @default(autoincrement())
  postId Int
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId Int?
  user   User? @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}
```

## Setup Instructions

### 1. Install Prisma
```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Initialize Prisma
```bash
npx prisma init
```

### 3. Update .env.local
```env
DATABASE_URL="postgresql://user:password@localhost:5432/medication_forum"
# OR for MongoDB:
# DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/medication_forum"
```

### 4. Update schema.prisma
Replace contents with the schema above

### 5. Run Migrations
```bash
npx prisma migrate dev --name init
```

### 6. Generate Prisma Client
```bash
npx prisma generate
```

## Key Features

✅ **Auto-increment ID** - Unique identifier for each post  
✅ **Search-ready** - drugName indexed for fast queries  
✅ **Filterable** - Can filter by differentFromPackage, createdAt  
✅ **Sortable** - CreatedAt index enables sorting  
✅ **Relations** - Links to User, Comment, Like models  
✅ **Timestamps** - Auto-managed creation date  
✅ **Optional fields** - reactionDescription is nullable  

## Notes

- Field names use camelCase for JavaScript consistency
- Use `mode: "insensitive"` for case-insensitive searches
- Indexes significantly improve query performance
- Relations use `onDelete: Cascade` for data integrity
- Consider adding `updatedAt: DateTime @updatedAt` for edit tracking
