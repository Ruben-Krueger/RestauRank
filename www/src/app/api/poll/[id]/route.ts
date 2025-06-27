import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../../../utils/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getDB();
    const pollId = params.id;

    // Validate poll ID
    if (!pollId) {
      return NextResponse.json(
        { error: "Poll ID is required" },
        { status: 400 }
      );
    }

    // Fetch poll with restaurants
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        restaurants: true,
        votes: true,
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (!poll.isActive) {
      return NextResponse.json(
        { error: "Poll is no longer active" },
        { status: 400 }
      );
    }

    // Check if poll has reached max voters
    const uniqueVoters = new Set(poll.votes.map((vote) => vote.userId));
    const hasReachedMaxVoters = uniqueVoters.size >= poll.maxVoters;

    return NextResponse.json({
      success: true,
      poll: {
        id: poll.id,
        title: poll.title,
        isActive: poll.isActive,
        maxVoters: poll.maxVoters,
        currentVoters: uniqueVoters.size,
        hasReachedMaxVoters,
        restaurants: poll.restaurants.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
          placeId: restaurant.placeId,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      {
        error: `Internal server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
