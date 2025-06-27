import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../../../../utils/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getDB();
    const { id: pollId } = await params;

    // Validate poll ID
    if (!pollId) {
      return NextResponse.json(
        { error: "Poll ID is required" },
        { status: 400 }
      );
    }

    // Fetch poll with restaurants and votes
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        restaurants: {
          include: {
            votes: {
              where: { pollId: pollId },
            },
          },
        },
        votes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Calculate results for each restaurant
    const results = poll.restaurants.map((restaurant) => {
      const votes = restaurant.votes;

      // Calculate total points (lower rank = higher points)
      const totalPoints = votes.reduce((sum, vote) => {
        return sum + (poll.restaurants.length - vote.rank + 1);
      }, 0);

      // Count votes for each rank
      const rankCounts = Array.from(
        { length: poll.restaurants.length },
        (_, i) => {
          const rank = i + 1;
          return votes.filter((vote) => vote.rank === rank).length;
        }
      );

      return {
        id: restaurant.id,
        name: restaurant.name,
        placeId: restaurant.placeId,
        totalPoints,
        voteCount: votes.length,
        rankCounts,
        averageRank:
          votes.length > 0
            ? votes.reduce((sum, vote) => sum + vote.rank, 0) / votes.length
            : 0,
      };
    });

    // Sort by total points (highest first)
    results.sort((a, b) => b.totalPoints - a.totalPoints);

    // Get unique voters
    const uniqueVoters = new Set(poll.votes.map((vote) => vote.userId));

    return NextResponse.json({
      success: true,
      results,
      totalVoters: uniqueVoters.size,
      maxVoters: poll.maxVoters,
      pollTitle: poll.title,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error);
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
