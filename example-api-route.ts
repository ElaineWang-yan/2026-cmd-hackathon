/**
 * Example Next.js API Route for Posts with Prisma
 * 
 * This shows how to create API endpoints that use the Post model
 * 
 * Route: /api/posts
 * Methods: GET (list/search), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/posts
 * Query params:
 * - q: search query (searches drug name and reaction description)
 * - page: page number (default: 1)
 * - limit: items per page (default: 10)
 * - different: filter by different from package (true/false)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const different = searchParams.get('different');

        const skip = (page - 1) * limit;

        let where: any = {};

        // Search by drug name or reaction description
        if (query) {
            where.OR = [
                { drugName: { contains: query, mode: 'insensitive' } },
                { reactionDescription: { contains: query, mode: 'insensitive' } },
            ];
        }

        // Filter by different from package
        if (different !== null) {
            where.differentFromPackage = different === 'true';
        }

        // Get posts with pagination
        const posts = await prisma.post.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, email: true } },
                _count: { select: { comments: true, likes: true } },
            },
        });

        // Get total count for pagination info
        const total = await prisma.post.count({ where });

        return NextResponse.json({
            success: true,
            data: posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('GET /api/posts error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/posts
 * Create a new post
 * 
 * Request body:
 * {
 *   "drugName": "Aspirin",
 *   "dosage": "500mg",
 *   "administrationTime": "Morning",
 *   "frequency": "Twice daily",
 *   "differentFromPackage": false,
 *   "reactionDescription": "Works well for headaches",
 *   "userId": "user-id-here"
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = [
            'drugName',
            'dosage',
            'administrationTime',
            'frequency',
            'differentFromPackage',
        ];

        for (const field of requiredFields) {
            if (!body[field] && body[field] !== false) {
                return NextResponse.json(
                    { success: false, error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Create post
        const post = await prisma.post.create({
            data: {
                drugName: body.drugName.trim(),
                dosage: body.dosage.trim(),
                administrationTime: body.administrationTime.trim(),
                frequency: body.frequency.trim(),
                differentFromPackage: body.differentFromPackage,
                reactionDescription: body.reactionDescription?.trim(),
                userId: body.userId,
            },
            include: {
                user: { select: { id: true, email: true } },
            },
        });

        return NextResponse.json(
            { success: true, data: post },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/posts error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create post' },
            { status: 500 }
        );
    }
}

/**
 * Example: GET /api/posts/[id]
 * Fetch single post by ID
 */
export async function getPostById(id: string) {
    return await prisma.post.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, email: true } },
            comments: {
                include: { user: { select: { email: true } } },
                orderBy: { createdAt: 'desc' },
            },
            likes: true,
        },
    });
}

/**
 * Example: DELETE /api/posts/[id]
 * Delete a post
 */
export async function deletePost(id: string) {
    return await prisma.post.delete({
        where: { id },
    });
}

/**
 * Example: PUT /api/posts/[id]
 * Update a post
 */
export async function updatePostById(id: string, data: any) {
    return await prisma.post.update({
        where: { id },
        data: {
            drugName: data.drugName,
            dosage: data.dosage,
            administrationTime: data.administrationTime,
            frequency: data.frequency,
            differentFromPackage: data.differentFromPackage,
            reactionDescription: data.reactionDescription,
        },
    });
}
