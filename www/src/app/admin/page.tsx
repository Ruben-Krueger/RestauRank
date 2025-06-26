"use client";

import { useState } from "react";

interface PopulateResponse {
  success: boolean;
  poll: {
    id: string;
    slug: string;
    createdAt: string;
  };
  restaurants: Array<{
    id: string;
    name: string;
    location: string;
  }>;
  totalRestaurants: number;
}

interface Poll {
  id: string;
  slug: string;
  createdAt: string;
  restaurantCount: number;
  voteCount: number;
  restaurants: Array<{
    id: string;
    name: string;
    location: string;
  }>;
}

export default function AdminPage() {
  const [location, setLocation] = useState("");
  const [pollSlug, setPollSlug] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PopulateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);

  const handlePopulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/populate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          pollSlug,
          limit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to populate database");
      }

      setResult(data);
      // Refresh polls list
      fetchPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await fetch("/api/populate");
      const data = await response.json();
      setPolls(data.polls);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
    }
  };

  // Fetch polls on component mount
  useState(() => {
    fetchPolls();
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Restaurant Database Admin</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Populate Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Populate Database</h2>

          <form onSubmit={handlePopulate} className="space-y-4">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="pollSlug"
                className="block text-sm font-medium mb-1"
              >
                Poll Slug
              </label>
              <input
                type="text"
                id="pollSlug"
                value={pollSlug}
                onChange={(e) => setPollSlug(e.target.value)}
                placeholder="e.g., sf-restaurants-2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="limit" className="block text-sm font-medium mb-1">
                Number of Restaurants
              </label>
              <input
                type="number"
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Populating..." : "Populate Database"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold">Success!</h3>
              <p>Created poll: {result.poll.slug}</p>
              <p>Added {result.totalRestaurants} restaurants</p>
            </div>
          )}
        </div>

        {/* Existing Polls */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Existing Polls</h2>

          <div className="space-y-3">
            {polls.map((poll) => (
              <div key={poll.id} className="border border-gray-200 rounded p-3">
                <h3 className="font-medium">{poll.slug}</h3>
                <p className="text-sm text-gray-600">
                  {poll.restaurantCount} restaurants • {poll.voteCount} votes
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(poll.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}

            {polls.length === 0 && (
              <p className="text-gray-500 text-center py-4">No polls found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
