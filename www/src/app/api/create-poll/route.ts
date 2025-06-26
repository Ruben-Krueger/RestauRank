import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const prisma = new PrismaClient();
    const body = await request.json();
    const { title, voterCount, restaurantCount } = body;

    // Validate required fields
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required and must be a string" },
        { status: 400 }
      );
    }

    if (!restaurantCount || restaurantCount < 3 || restaurantCount > 10) {
      return NextResponse.json(
        { error: "Restaurant count must be between 3 and 10" },
        { status: 400 }
      );
    }

    if (!voterCount && (voterCount < 3 || voterCount > 10)) {
      return NextResponse.json(
        { error: "Max rankings must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Create the poll
    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        maxVoters: voterCount,
      },
    });

    const availableRestaurants = await prisma.restaurant.findMany({
      take: restaurantCount,
    });

    if (availableRestaurants < restaurantCount) {
      return NextResponse.json(
        {
          error: "Error: could not find enough restaurants",
        },
        { status: 500 }
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
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: `Internal server error: ${JSON.stringify(error)}`,
      },
      { status: 500 }
    );
  }
}
