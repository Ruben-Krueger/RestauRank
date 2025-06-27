"use client";
import { Button, Flex, Typography, Space, Card } from "antd";
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

// Sortable restaurant item component
function SortableRestaurantItem({
  restaurant,
  index,
}: {
  restaurant: { id: string; name: string; link: string };
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
          console.log("here");
          window.open(restaurant.link, "_blank");
        }}
        size="small"
        className={styles.infoButton}
      />
    </div>
  );
}

export default function VotePage() {
  const params = useParams();
  const voteId = params.id;
  const [rankedOptions, setRankedOptions] = useState<
    Array<{ id: string; name: string; link: string }>
  >([]);

  // Mock data - you'll replace this with actual data fetching
  const mockPoll = {
    id: voteId,
    title: "Rank your favorite restaurants",
    options: [
      {
        id: "1",
        name: "Tartine Bakery",
        link: "https://www.google.com/maps/place/Tartine+Bakery/@37.7767135,-122.4353989,15z/data=!4m6!3m5!1s0x808f7e1807365605:0x601f7a97f0ce6c6b!8m2!3d37.7614347!4d-122.4240821!16s%2Fm%2F03gmfm5?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D",
      },
      {
        id: "2",
        name: "Restaurant B",
        link: "https://www.google.com/maps/place/Tartine+Bakery/@37.7767135,-122.4353989,15z/data=!4m6!3m5!1s0x808f7e1807365605:0x601f7a97f0ce6c6b!8m2!3d37.7614347!4d-122.4240821!16s%2Fm%2F03gmfm5?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D",
      },
      {
        id: "3",
        name: "Restaurant C",
        link: "https://www.google.com/maps/place/Tartine+Bakery/@37.7767135,-122.4353989,15z/data=!4m6!3m5!1s0x808f7e1807365605:0x601f7a97f0ce6c6b!8m2!3d37.7614347!4d-122.4240821!16s%2Fm%2F03gmfm5?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D",
      },
    ],
  };

  // Initialize ranked options when component mounts
  useEffect(() => {
    setRankedOptions([...mockPoll.options]);
  }, []);

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

      alert("Ranked vote submitted successfully!");
      // Optionally redirect or show results
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit vote. Please try again."
      );
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
              Submit
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
