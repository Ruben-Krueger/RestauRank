"use client";
import { Button, Flex, Typography, Space } from "antd";

const { Title, Text } = Typography;

export default function Vote() {
  return (
    <main className="min-h-screen">
      <Flex
        justify="center"
        align="center"
        vertical
        style={{ minHeight: "100vh" }}
      >
        <Title>Vote!</Title>
        <Text>Let&apos;s vote!</Text>
        <Space direction="vertical" size="large">
          <Button href="/create" type="primary">
            Create poll
          </Button>
        </Space>
      </Flex>
    </main>
  );
}
