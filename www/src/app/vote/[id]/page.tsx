"use client";
import { Button, Flex, Typography, Space, Card, Alert, Spin } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
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
}: {
  restaurant: { id: string; name: string; placeId: string };
  index: number;
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
        className={styles.sortableItem}
      >
        <Flex align="center" gap="small">
          <div className={styles.rankBadge}>{index + 1}</div>
          <Text strong>{restaurant.name}</Text>
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

  const handleDragEnd = (event: DragEndEvent) => {
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

      // Optionally redirect or show results
    } catch (error) {
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to submit vote. Please try again.")
      );
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

          <div className={styles.rankingInstructions}>
            <Text type="secondary">
              Drag and drop restaurants to rank them from your most preferred
              (top) to least preferred (bottom)
            </Text>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rankedOptions.map((option) => option.id)}
              strategy={verticalListSortingStrategy}
            >
              <Space
                direction="vertical"
                className={styles.voteOptions}
                style={{ width: "100%" }}
              >
                {rankedOptions.map((option, index) => (
                  <SortableRestaurantItem
                    key={option.id}
                    restaurant={option}
                    index={index}
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
                disabled={
                  rankedOptions.length === 0 || poll.hasReachedMaxVoters
                }
              >
                {poll.hasReachedMaxVoters ? "Poll Full" : "Submit"}
              </Button>
            </div>
            <div>
              {error ? (
                <Alert message={error.message} type="error" showIcon />
              ) : isSuccesful ? (
                <Alert
                  message="Your vote was submitted successfully!"
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
