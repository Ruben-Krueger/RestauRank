"use client";

import { JSX, useState } from "react";
import { Button, InputNumber, Typography, Space, Card, message } from "antd";
import { useRouter } from "next/navigation";

const { Title } = Typography;

const styles = {
  main: { padding: "24px", maxWidth: "600px", margin: "0 auto" },
  space: {},
  title: { textAlign: "center", margin: 0 },
  fullWidth: { width: "100%" },
};

export default function Page(): JSX.Element {
  const [restaurantCount, setRestaurantCount] = useState<number>(3);
  const [voterCount, setVoterCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const createPoll = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-poll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Restaurant Ranking Poll",
          description: `Poll with ${restaurantCount} restaurants and ${voterCount} voters`,
          maxRankings: voterCount,
          restaurantCount: restaurantCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create poll");
      }

      message.success("Poll created successfully!");
      // Navigate to the poll page or wherever you want to go after creation
      router.push("/rank");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to create poll"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <Card>
        <Space direction="vertical" size="large" style={styles.fullWidth}>
          <Title level={2} style={{ textAlign: "center", margin: 0 }}>
            Create Poll
          </Title>

          <Space direction="vertical" style={styles.fullWidth}>
            <label htmlFor="restaurant-count">
              Number of restaurants to choose from:
            </label>
            <InputNumber
              id="restaurant-count"
              min={3}
              max={10}
              value={restaurantCount}
              onChange={(value) => setRestaurantCount(value || 3)}
              style={styles.fullWidth}
            />

            <label htmlFor="restaurant-count">Number of voters:</label>
            <InputNumber
              id="participant-count"
              min={3}
              max={10}
              value={voterCount}
              onChange={(value) => setVoterCount(value || 3)}
              style={styles.fullWidth}
            />
          </Space>

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={createPoll}
            style={styles.fullWidth}
          >
            Create Poll
          </Button>
        </Space>
      </Card>
    </main>
  );
}
