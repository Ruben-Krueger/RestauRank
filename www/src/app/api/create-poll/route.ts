import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../../utils/db";

export async function POST(request: NextRequest) {
  try {
    const prisma = getDB();
    const body = await request.json();
    const { title, maxVoters, restaurantCount } = body;

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

    if (!maxVoters || maxVoters < 3 || maxVoters > 10) {
      return NextResponse.json(
        { error: "Number of voters must be between 3 and 10" },
        { status: 400 }
      );
    }

    // Create the poll
    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        maxVoters,
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
