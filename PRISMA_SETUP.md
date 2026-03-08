# Prisma Setup Quick Start

## Files Created

1. **prisma/schema.prisma** - Your database schema
2. **prisma/post-service.ts** - Service functions for all operations
3. **prisma_post_model.md** - Detailed documentation

## Installation Steps

### 1. Install Prisma and Dependencies

```bash
npm install @prisma/client
npm install -D prisma ts-node @types/node
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Set Up Environment Variables

Create `.env.local` in your root directory:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/medication_forum?retryWrites=true&w=majority"
```

Or for local MongoDB:

```env
DATABASE_URL="mongodb://localhost:27017/medication_forum"
```

### 4. Initialize Database

```bash
npx prisma migrate dev --name init
```

Or just push the schema:

```bash
npx prisma db push
```

### 5. Generate Prisma Studio (Optional)

```bash
npx prisma studio
```

This opens http://localhost:5555 where you can browse your data.

---

## Quick Test

Create a `test.ts` file:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a post
  const post = await prisma.post.create({
    data: {
      drugName: 'Aspirin',
      dosage: '500mg',
      administrationTime: 'Morning',
      frequency: 'Twice daily',
      differentFromPackage: false,
      reactionDescription: 'Works well for headaches',
    },
  });
  
  console.log('Created post:', post);
  
  // Search for posts
  const results = await prisma.post.findMany({
    where: {
      drugName: { contains: 'aspirin', mode: 'insensitive' }
    }
  });
  
  console.log('Search results:', results);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

Run with:

```bash
npx ts-node test.ts
```

---

## Using the Post Service

### In Your API Routes

```typescript
// src/app/api/posts/route.ts
import { createPost, getAllPosts, searchPosts } from '@/prisma/post-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  
  if (query) {
    const results = await searchPosts(query, page);
    return Response.json(results);
  }
  
  const posts = await getAllPosts(page);
  return Response.json(posts);
}

export async function POST(req: Request) {
  const data = await req.json();
  const post = await createPost(data);
  return Response.json(post, { status: 201 });
}
```

---

## Common Operations

### Search
```typescript
import { searchPosts } from '@/prisma/post-service';

const results = await searchPosts('ibuprofen');
```

### Filter
```typescript
import { getPostsDifferentFromPackage, getPostsByMedication } from '@/prisma/post-service';

// Get posts that differ from package
const different = await getPostsDifferentFromPackage();

// Get posts for specific med with filter
const aspirin = await getPostsByMedication('Aspirin', true);
```

### Get User's Posts
```typescript
import { getPostsByUser } from '@/prisma/post-service';

const userPosts = await getPostsByUser(userId);
```

### Like/Unlike
```typescript
import { likePost, unlikePost } from '@/prisma/post-service';

await likePost(postId, userId);
await unlikePost(postId, userId);
```

---

## Database URL Examples

### MongoDB Atlas
```
mongodb+srv://user:pass@cluster0.mongodb.net/dbname?retryWrites=true&w=majority
```

### Local MongoDB
```
mongodb://localhost:27017/medication_forum
```

### PostgreSQL
```
postgresql://user:password@localhost:5432/medication_forum
```

### MySQL
```
mysql://user:password@localhost:3306/medication_forum
```

---

## Useful Commands

```bash
# View/edit database GUI
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# Reset database (careful!)
npx prisma migrate reset

# View migrations
npx prisma migrate status

# Create migration without applying
npx prisma migrate dev --create-only
```

---

## Field Types Reference

| Type | Example |
|------|---------|
| String | `text: String` |
| Text (Long) | `text: String @db.Text` |
| Int | `count: Int` |
| Boolean | `active: Boolean @default(true)` |
| DateTime | `createdAt: DateTime @default(now())` |
| Float | `rating: Float` |
| Decimal | `price: Decimal` |
| JSON | `metadata: Json` |

---

## Tips

✅ Always use `@index()` on fields you search/filter by  
✅ Use `@unique` for fields that should be unique  
✅ Use `@relation` for connecting models  
✅ Use `onDelete: Cascade` to auto-delete related records  
✅ Use `@updatedAt` for automatic timestamp updates  
✅ Run `npx prisma generate` after schema changes  
✅ Use `mode: 'insensitive'` for case-insensitive searches  

---

## Next Steps

1. ✅ Set DATABASE_URL in .env.local
2. ✅ Run `npx prisma migrate dev --name init`
3. ✅ Start using the post-service functions
4. ✅ Create API routes that call these functions
5. ✅ Connect frontend to your API
