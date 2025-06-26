"use client";
import { Button, Flex, Typography, Space } from "antd";

const { Title, Text } = Typography;

export default function Home() {
  return (
    <main className="min-h-screen">
      <Flex
        justify="center"
        align="center"
        vertical
        style={{ minHeight: "100vh" }}
      >
        <Title>Let&apos;s eat!</Title>
        <Text>
          RestauRank is the easiest way to agree on restaurants with friends.
        </Text>
        <Space direction="vertical" size="large">
          <Button href="/create" type="primary">
            Create poll
          </Button>
        </Space>
      </Flex>
    </main>
  );
}
