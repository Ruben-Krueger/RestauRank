"use client";

import { JSX, useState } from "react";
import {
  Button,
  InputNumber,
  Typography,
  Space,
  Card,
  Alert,
  Input,
  Progress,
} from "antd";
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
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [redirectProgress, setRedirectProgress] = useState<number>(0);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const [titleText, setTitleText] = useState<string>("");

  const router = useRouter();

  const createPoll = async () => {
    setLoading(true);
    setAlert({ type: null, message: "" });

    try {
      const response = await fetch("/api/create-poll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: titleText || "Restaurant Ranking Poll",
          description: `Poll with ${restaurantCount} restaurants and ${voterCount} voters`,
          maxVoters: voterCount,
          restaurantCount: restaurantCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create poll");
      }

      setAlert({ type: "success", message: "Poll created successfully!" });
      const poll = data.poll;

      // Start redirect progress
      setRedirecting(true);
      setRedirectProgress(0);

      // Animate progress bar over 1.5 seconds
      const progressInterval = setInterval(() => {
        setRedirectProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            router.push(`/vote/${poll.id}`);
            return 100;
          }
          return prev + 10;
        });
      }, 150); // 150ms intervals to reach 100% in 1.5 seconds
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create poll",
      });
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

          {alert.type && (
            <Alert
              message={alert.message}
              type={alert.type}
              showIcon
              closable
              onClose={() => setAlert({ type: null, message: "" })}
            />
          )}

          {redirecting && (
            <div>
              <Typography.Text>Redirecting to voting page...</Typography.Text>
              <Progress
                percent={redirectProgress}
                status="active"
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                showInfo={false}
              />
            </div>
          )}

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

            <label htmlFor="voter-count">Number of voters:</label>
            <InputNumber
              id="participant-count"
              min={3}
              max={10}
              value={voterCount}
              onChange={(value) => setVoterCount(value || 3)}
              style={styles.fullWidth}
            />

            <label htmlFor="title-text">Add a short title for this:</label>
            <Input
              id="title-text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              style={styles.fullWidth}
              placeholder="Andre's birthday dinner"
            />
          </Space>

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={createPoll}
            style={styles.fullWidth}
            disabled={redirecting}
          >
            Create Poll
          </Button>
        </Space>
      </Card>
    </main>
  );
}
