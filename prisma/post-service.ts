/**
 * Post Service - Examples for common operations with Prisma Post model
 * 
 * This file demonstrates how to use the Post model for:
 * - Creating posts
 * - Searching by medication name
 * - Filtering by reaction type
 * - Retrieving posts with pagination
 * - Getting posts by user
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a new medication experience post
 */
export async function createPost(data: {
    drugName: string;
    dosage: string;
    administrationTime: string;
    frequency: string;
    differentFromPackage: boolean;
    reactionDescription?: string;
    userId?: string;
}) {
    return await prisma.post.create({
        data: {
            drugName: data.drugName,
            dosage: data.dosage,
            administrationTime: data.administrationTime,
            frequency: data.frequency,
            differentFromPackage: data.differentFromPackage,
            reactionDescription: data.reactionDescription,
            userId: data.userId,
        },
    });
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all posts with pagination
 */
export async function getAllPosts(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, email: true } },
            comments: true,
            likes: true,
        },
    });
}

/**
 * Get a single post by ID
 */
export async function getPostById(id: string) {
    return await prisma.post.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, email: true } },
            comments: { include: { user: { select: { email: true } } } },
            likes: true,
        },
    });
}

// ============================================
// SEARCH OPERATIONS
// ============================================

/**
 * Search posts by drug name (case-insensitive)
 */
export async function searchByDrugName(
    drugName: string,
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        where: {
            drugName: {
                contains: drugName,
                mode: 'insensitive',
            },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, email: true } },
            _count: { select: { comments: true, likes: true } },
        },
    });
}

/**
 * Search posts by reaction description
 */
export async function searchByReaction(
    keyword: string,
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        where: {
            reactionDescription: {
                contains: keyword,
                mode: 'insensitive',
            },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Search across both drug name and reaction description
 */
export async function searchPosts(
    query: string,
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        where: {
            OR: [
                {
                    drugName: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                {
                    reactionDescription: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
            ],
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { email: true } },
            _count: { select: { comments: true, likes: true } },
        },
    });
}

// ============================================
// FILTER OPERATIONS
// ============================================

/**
 * Filter posts that differ from package
 */
export async function getPostsDifferentFromPackage(
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        where: { differentFromPackage: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Filter posts that match package
 */
export async function getPostsMatchingPackage(
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        where: { differentFromPackage: false },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get posts by specific medication with optional reaction filter
 */
export async function getPostsByMedication(
    drugName: string,
    differentFromPackage?: boolean,
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    const where: any = {
        drugName: {
            contains: drugName,
            mode: 'insensitive',
        },
    };

    if (differentFromPackage !== undefined) {
        where.differentFromPackage = differentFromPackage;
    }

    return await prisma.post.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
    });
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get all posts by a specific user
 */
export async function getPostsByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10
) {
    const skip = (page - 1) * pageSize;

    return await prisma.post.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
            comments: true,
            likes: true,
        },
    });
}

// ============================================
// LIKE OPERATIONS
// ============================================

/**
 * Like a post
 */
export async function likePost(postId: string, userId: string) {
    // Check if already liked
    const existingLike = await prisma.like.findUnique({
        where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
        throw new Error('Post already liked');
    }

    return await prisma.like.create({
        data: { postId, userId },
    });
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string, userId: string) {
    return await prisma.like.delete({
        where: { postId_userId: { postId, userId } },
    });
}

/**
 * Get like count for a post
 */
export async function getPostLikeCount(postId: string) {
    return await prisma.like.count({
        where: { postId },
    });
}

// ============================================
// COMMENT OPERATIONS
// ============================================

/**
 * Add comment to a post
 */
export async function addComment(
    postId: string,
    userId: string | undefined,
    content: string
) {
    return await prisma.comment.create({
        data: {
            postId,
            userId,
            content,
        },
    });
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string) {
    return await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { email: true } },
        },
    });
}

// ============================================
// SORT OPERATIONS
// ============================================

/**
 * Get newest posts
 */
export async function getNewestPosts(pageSize: number = 10) {
    return await prisma.post.findMany({
        take: pageSize,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get oldest posts
 */
export async function getOldestPosts(pageSize: number = 10) {
    return await prisma.post.findMany({
        take: pageSize,
        orderBy: { createdAt: 'asc' },
    });
}

/**
 * Get most liked posts
 */
export async function getMostLikedPosts(pageSize: number = 10) {
    return await prisma.post.findMany({
        take: pageSize,
        orderBy: {
            likes: { _count: 'desc' },
        },
        include: {
            _count: { select: { likes: true } },
        },
    });
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update a post
 */
export async function updatePost(
    id: string,
    data: {
        drugName?: string;
        dosage?: string;
        administrationTime?: string;
        frequency?: string;
        differentFromPackage?: boolean;
        reactionDescription?: string;
    }
) {
    return await prisma.post.update({
        where: { id },
        data,
    });
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a post (and related comments/likes via cascade)
 */
export async function deletePost(id: string) {
    return await prisma.post.delete({
        where: { id },
    });
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get total number of posts
 */
export async function getTotalPostCount() {
    return await prisma.post.count();
}

/**
 * Get count of posts that differ from package
 */
export async function getDifferentFromPackageCount() {
    return await prisma.post.count({
        where: { differentFromPackage: true },
    });
}

/**
 * Get most common medications
 */
export async function getMostCommonMedications(limit: number = 10) {
    const posts = await prisma.post.groupBy({
        by: ['drugName'],
        _count: {
            id: true,
        },
        orderBy: {
            _count: {
                id: 'desc',
            },
        },
        take: limit,
    });

    return posts.map((item: { drugName: string; _count: { id: number } }) => ({
        drugName: item.drugName,
        count: item._count.id,
    }));
}
