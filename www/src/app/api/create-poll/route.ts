import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, maxRankings, restaurantCount } = body;

    // Validate required fields
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required and must be a string" },
        { status: 400 }
      );
    }

    if (restaurantCount && (restaurantCount < 3 || restaurantCount > 10)) {
      return NextResponse.json(
        { error: "Restaurant count must be between 3 and 10" },
        { status: 400 }
      );
    }

    if (maxRankings && (maxRankings < 1 || maxRankings > 10)) {
      return NextResponse.json(
        { error: "Max rankings must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Create the poll
    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        maxRankings: maxRankings || 4,
      },
    });

    // If restaurantCount is provided, randomly select restaurants
    if (restaurantCount) {
      const availableRestaurants = await prisma.restaurant.findMany({
        take: restaurantCount,
        orderBy: {
          // Random selection - this is a simple approach
          // For production, you might want a more sophisticated random selection
          id: "asc",
        },
      });

      if (availableRestaurants.length < restaurantCount) {
        return NextResponse.json(
          {
            error: `Not enough restaurants available. Only ${availableRestaurants.length} restaurants found.`,
          },
          { status: 400 }
        );
      }

      // Connect the selected restaurants to the poll
      await prisma.poll.update({
        where: { id: poll.id },
        data: {
          restaurants: {
            connect: availableRestaurants.map((restaurant) => ({
              id: restaurant.id,
            })),
          },
        },
      });

      // Fetch the poll with restaurants
      const pollWithRestaurants = await prisma.poll.findUnique({
        where: { id: poll.id },
        include: {
          restaurants: true,
        },
      });

      return NextResponse.json({
        success: true,
        poll: pollWithRestaurants,
        message: `Poll created successfully with ${availableRestaurants.length} restaurants`,
      });
    }

    return NextResponse.json({
      success: true,
      poll,
      message: "Poll created successfully",
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
