"use client";
import { Button, Flex, Typography, Space, Card, Alert, Spin } from "antd";
import { InfoCircleOutlined, ShareAltOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./page.module.css";

const { Title, Text } = Typography;

function SortableRestaurantItem({
  restaurant,
  index,
  showResults = false,
  result,
}: {
  restaurant: { id: string; name: string; placeId: string };
  index: number;
  showResults?: boolean;
  result?: {
    totalPoints: number;
    voteCount: number;
    rankCounts: number[];
    averageRank: number;
  };
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: restaurant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div className={styles.restaurantRow}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`${styles.sortableItem} ${
          showResults ? styles.resultItem : ""
        }`}
      >
        <Flex align="center" gap="small" style={{ width: "100%" }}>
          <div
            className={`${styles.rankBadge} ${
              showResults ? styles.resultRankBadge : ""
            }`}
          >
            {showResults && result ? index + 1 : index + 1}
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>{restaurant.name}</Text>
            {showResults && result && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {result.totalPoints} points • {result.voteCount} votes • Avg
                  rank: {result.averageRank.toFixed(1)}
                </Text>
                <div style={{ marginTop: 4 }}>
                  {result.rankCounts.map(
                    (count, rankIndex) =>
                      count > 0 && (
                        <Text
                          key={rankIndex}
                          type="secondary"
                          style={{ fontSize: "11px", marginRight: 8 }}
                        >
                          {rankIndex + 1}st: {count}
                        </Text>
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        </Flex>
      </div>
      <Button
        type="text"
        icon={<InfoCircleOutlined />}
        onClick={() => {
          // Create Google Maps link using placeId
          const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${restaurant.placeId}`;
          window.open(mapsUrl, "_blank");
        }}
        size="small"
        className={styles.infoButton}
      />
    </div>
  );
}

interface Poll {
  id: string;
  title: string;
  isActive: boolean;
  maxVoters: number;
  currentVoters: number;
  hasReachedMaxVoters: boolean;
  restaurants: Array<{
    id: string;
    name: string;
    placeId: string;
  }>;
}

interface PollResult {
  id: string;
  name: string;
  placeId: string;
  totalPoints: number;
  voteCount: number;
  rankCounts: number[];
  averageRank: number;
}

export default function VotePage() {
  const params = useParams();
  const voteId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rankedOptions, setRankedOptions] = useState<
    Array<{ id: string; name: string; placeId: string }>
  >([]);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccesful, setIsSuccesful] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [results, setResults] = useState<PollResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch poll data on component mount
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        const response = await fetch(`/api/poll/${voteId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch poll");
        }

        setPoll(result.poll);
        setRankedOptions([...result.poll.restaurants]);

        // Check if there are any votes to show results
        if (result.poll.currentVoters > 0) {
          await fetchResults();
        }
      } catch (error) {
        setFetchError(
          error instanceof Error ? error.message : "Failed to fetch poll"
        );
      } finally {
        setLoading(false);
      }
    };

    if (voteId) {
      fetchPoll();
    }
  }, [voteId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/poll/${voteId}/results`);
      const result = await response.json();

      if (response.ok) {
        setResults(result.results);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (hasVoted || showResults) return; // Disable dragging if voted or showing results

    const { active, over } = event;

    if (active.id !== over?.id) {
      setRankedOptions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleVote = async () => {
    setError(null);
    setIsSuccesful(false);

    try {
      const response = await fetch(`/api/vote/${voteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rankings: rankedOptions.map((option, index) => ({
            optionId: option.id,
            rank: index + 1,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit vote");
      }

      setIsSuccesful(true);
      setHasVoted(true);

      // Fetch and show updated results
      await fetchResults();

      // Update poll data to reflect new vote count
      const pollResponse = await fetch(`/api/poll/${voteId}`);
      if (pollResponse.ok) {
        const pollResult = await pollResponse.json();
        setPoll(pollResult.poll);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to submit vote. Please try again.")
      );
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.title || "Restaurant Poll",
          text: `Vote on this restaurant poll: ${poll?.title}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to clipboard
        await copyToClipboard(shareUrl);
      }
    } else {
      // Fallback to clipboard
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if you want
      console.log("URL copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  if (loading) {
    return (
      <main className={styles.votePage}>
        <Flex
          justify="center"
          align="center"
          vertical
          className={styles.voteContainer}
        >
          <Card className={styles.voteCard}>
            <Flex
              justify="center"
              align="center"
              style={{ minHeight: "200px" }}
            >
              <Spin size="large" />
            </Flex>
          </Card>
        </Flex>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className={styles.votePage}>
        <Flex
          justify="center"
          align="center"
          vertical
          className={styles.voteContainer}
        >
          <Card className={styles.voteCard}>
            <Alert
              message="Error Loading Poll"
              description={fetchError}
              type="error"
              showIcon
            />
          </Card>
        </Flex>
      </main>
    );
  }

  if (!poll) {
    return (
      <main className={styles.votePage}>
        <Flex
          justify="center"
          align="center"
          vertical
          className={styles.voteContainer}
        >
          <Card className={styles.voteCard}>
            <Alert
              message="Poll Not Found"
              description="The poll you're looking for doesn't exist or is no longer active."
              type="warning"
              showIcon
            />
          </Card>
        </Flex>
      </main>
    );
  }

  const displayOptions = showResults ? results : rankedOptions;
  const isVotingDisabled = hasVoted || poll.hasReachedMaxVoters || showResults;

  return (
    <main className={styles.votePage}>
      <Flex
        justify="center"
        align="center"
        vertical
        className={styles.voteContainer}
      >
        <Card className={styles.voteCard}>
          <Title level={2} className={styles.voteTitle}>
            {poll.title}
          </Title>

          {!showResults && (
            <div className={styles.rankingInstructions}>
              <Text type="secondary">
                Drag and drop restaurants to rank them from your most preferred
                (top) to least preferred (bottom)
              </Text>
            </div>
          )}

          {showResults && (
            <div className={styles.rankingInstructions}>
              <Text type="secondary">
                Poll Results - {poll.currentVoters}/{poll.maxVoters} voters have
                participated
              </Text>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayOptions.map((option) => option.id)}
              strategy={verticalListSortingStrategy}
            >
              <Space
                direction="vertical"
                className={styles.voteOptions}
                style={{ width: "100%" }}
              >
                {displayOptions.map((option, index) => (
                  <SortableRestaurantItem
                    key={option.id}
                    restaurant={option}
                    index={index}
                    showResults={showResults}
                    result={
                      showResults
                        ? results.find((r) => r.id === option.id)
                        : undefined
                    }
                  />
                ))}
              </Space>
            </SortableContext>
          </DndContext>

          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div className={styles.voteSubmit}>
              <Button
                type="primary"
                onClick={handleVote}
                block
                disabled={isVotingDisabled}
              >
                {hasVoted
                  ? "Vote Submitted"
                  : poll.hasReachedMaxVoters
                  ? "Poll Full"
                  : showResults
                  ? "Viewing Results"
                  : "Submit"}
              </Button>
            </div>

            {hasVoted && (
              <div className={styles.voteSubmit}>
                <Button icon={<ShareAltOutlined />} onClick={handleShare} block>
                  Share Poll
                </Button>
              </div>
            )}

            <div>
              {error ? (
                <Alert message={error.message} type="error" showIcon />
              ) : isSuccesful ? (
                <Alert
                  message="Your vote was submitted successfully! Results are now visible."
                  type="success"
                  showIcon
                />
              ) : null}
            </div>
          </Space>

          <div className={styles.votePollId}>
            <Text type="secondary">
              Poll ID: {voteId} • {poll.currentVoters}/{poll.maxVoters} voters
            </Text>
          </div>
        </Card>
      </Flex>
    </main>
  );
}
