"use client";
import { Button, Flex, Typography, Space, Card, Form } from "antd";
import { useParams } from "next/navigation";
import { useState } from "react";
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
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./page.module.css";

const { Title, Text } = Typography;

// Sortable restaurant item component
function SortableRestaurantItem({
  restaurant,
  index,
}: {
  restaurant: { id: string; name: string; votes: number };
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.sortableItem}
    >
      <Flex
        justify="space-between"
        align="center"
        className={styles.voteOptionRow}
      >
        <Flex align="center" gap="small">
          <div className={styles.rankBadge}>{index + 1}</div>
          <Text strong>{restaurant.name}</Text>
        </Flex>
        <Text type="secondary">({restaurant.votes} votes)</Text>
      </Flex>
    </div>
  );
}

export default function VotePage() {
  const params = useParams();
  const voteId = params.id;
  const [rankedOptions, setRankedOptions] = useState<
    Array<{ id: string; name: string; votes: number }>
  >([]);
  const [form] = Form.useForm();

  // Mock data - you'll replace this with actual data fetching
  const mockPoll = {
    id: voteId,
    title: "Rank your favorite restaurants",
    options: [
      { id: "1", name: "Restaurant A", votes: 5 },
      { id: "2", name: "Restaurant B", votes: 3 },
      { id: "3", name: "Restaurant C", votes: 7 },
    ],
  };

  // Initialize ranked options when component mounts
  useState(() => {
    setRankedOptions([...mockPoll.options]);
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    try {
      console.log("Ranked options:", rankedOptions);
      console.log("Poll ID:", voteId);

      // You'll make an API call here to submit the ranked vote
      // await fetch(`/api/vote/${voteId}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     rankings: rankedOptions.map((option, index) => ({
      //       optionId: option.id,
      //       rank: index + 1
      //     }))
      //   })
      // });

      alert("Ranked vote submitted successfully!");
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Failed to submit vote. Please try again.");
    }
  };

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
            {mockPoll.title}
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

          <div className={styles.voteSubmit}>
            <Button
              type="primary"
              onClick={handleVote}
              block
              disabled={rankedOptions.length === 0}
            >
              Submit Ranked Vote
            </Button>
          </div>

          <div className={styles.votePollId}>
            <Text type="secondary">Poll ID: {voteId}</Text>
          </div>
        </Card>
      </Flex>
    </main>
  );
}
