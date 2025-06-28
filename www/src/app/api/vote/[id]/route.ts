import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../../../utils/db";
import { checkRateLimitOrThrow } from "@/utils/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit first
    const rateLimitResponse = await checkRateLimitOrThrow(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const prisma = getDB();
    const { id: pollId } = await params;
    const body = await request.json();
    const { rankings } = body;

    // Validate poll ID
    if (!pollId) {
      return NextResponse.json(
        { error: "Poll ID is required" },
        { status: 400 }
      );
    }

    // Check if poll exists and is active
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
    if (uniqueVoters.size >= poll.maxVoters) {
      return NextResponse.json(
        { error: "Poll has reached maximum number of voters" },
        { status: 400 }
      );
    }

    // Validate rankings
    if (!rankings || !Array.isArray(rankings)) {
      return NextResponse.json(
        { error: "Rankings must be an array" },
        { status: 400 }
      );
    }

    if (rankings.length === 0) {
      return NextResponse.json(
        { error: "At least one ranking is required" },
        { status: 400 }
      );
    }

    // Validate that all ranked restaurants exist in the poll
    const pollRestaurantIds = poll.restaurants.map((r) => r.id);
    const rankedRestaurantIds = rankings.map((r) => r.optionId);

    const invalidRestaurants = rankedRestaurantIds.filter(
      (id) => !pollRestaurantIds.includes(id)
    );

    if (invalidRestaurants.length > 0) {
      return NextResponse.json(
        { error: "Invalid restaurant IDs in rankings" },
        { status: 400 }
      );
    }

    // Validate that all restaurants in the poll are ranked
    const unrankedRestaurants = pollRestaurantIds.filter(
      (id) => !rankedRestaurantIds.includes(id)
    );

    if (unrankedRestaurants.length > 0) {
      return NextResponse.json(
        { error: "All restaurants in the poll must be ranked" },
        { status: 400 }
      );
    }

    // Validate that ranks are sequential starting from 1
    const expectedRanks = Array.from(
      { length: rankings.length },
      (_, i) => i + 1
    );
    const actualRanks = rankings.map((r) => r.rank).sort((a, b) => a - b);

    if (JSON.stringify(expectedRanks) !== JSON.stringify(actualRanks)) {
      return NextResponse.json(
        { error: "Ranks must be sequential starting from 1" },
        { status: 400 }
      );
    }

    // For now, we'll create a temporary user for the vote
    // In a real app, you'd get the user from authentication
    const tempUser = await prisma.user.create({
      data: {
        email: `temp-${Date.now()}@example.com`,
        name: "Anonymous Voter",
      },
    });

    // Create votes for each ranking
    const votes = await Promise.all(
      rankings.map((ranking) =>
        prisma.vote.create({
          data: {
            userId: tempUser.id,
            pollId: pollId,
            restaurantId: ranking.optionId,
            rank: ranking.rank,
          },
        })
      )
    );

    // Fetch updated poll with votes
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        restaurants: {
          include: {
            votes: {
              where: { pollId: pollId },
            },
          },
        },
        votes: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vote submitted successfully",
      poll: updatedPoll,
      votesSubmitted: votes.length,
    });
  } catch (error) {
    console.error("Error submitting vote:", error);

    // Handle unique constraint violation

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
