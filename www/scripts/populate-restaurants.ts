import { PrismaClient } from "../src/generated/prisma";
import {
  Client,
  PlaceType1,
  Place,
  PlacesNearbyResponse,
  PlaceDetailsResponse,
} from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function searchRestaurants(
  location: string,
  limit: number = 20
): Promise<Place[]> {
  const client = new Client({});
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }

  try {
    // First, get the coordinates for the location
    const geocodeResponse = await client.geocode({
      params: {
        address: location,
        key: apiKey,
      },
    });

    if (geocodeResponse.data.results.length === 0) {
      throw new Error(`Could not find coordinates for location: ${location}`);
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

    // Search for restaurants near the coordinates
    const placesResponse = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: 5000, // 5km radius
        type: PlaceType1.restaurant,
        key: apiKey,
      },
    });

    if (placesResponse.data.status !== "OK") {
      throw new Error(`Places API error: ${placesResponse.data.status}`);
    }

    // Get detailed information for each place
    const detailedPlaces = await Promise.all(
      placesResponse.data.results.slice(0, limit).map(async (place) => {
        try {
          const detailsResponse = await client.placeDetails({
            params: {
              place_id: place.place_id!,
              fields: [
                "name",
                "formatted_address",
                "rating",
                "user_ratings_total",
                "price_level",
                "types",
                "geometry",
              ],
              key: apiKey,
            },
          });

          return detailsResponse.data.result as Place;
        } catch (error) {
          console.warn(
            `Failed to get details for place ${place.place_id}:`,
            error
          );
          return place as Place;
        }
      })
    );

    return detailedPlaces.filter((place) => place !== null);
  } catch (error) {
    console.error("Error fetching restaurants from Google Places:", error);
    throw error;
  }
}

async function createPollWithRestaurants(
  location: string,
  slug: string
): Promise<void> {
  try {
    console.log(`Searching for restaurants in ${location}...`);
    const restaurants = await searchRestaurants(location, 20);

    if (restaurants.length === 0) {
      console.log(`No restaurants found for ${location}`);
      return;
    }

    // Create the poll
    const poll = await prisma.poll.create({
      data: {
        slug,
      },
    });

    console.log(`Created poll with ID: ${poll.id}`);

    // Add restaurants to the poll
    const restaurantData = restaurants.map((restaurant) => ({
      name: restaurant.name || "Unknown Restaurant",
      location: restaurant.formatted_address || "Unknown Location",
      pollId: poll.id,
    }));

    await prisma.restaurant.createMany({
      data: restaurantData,
    });

    console.log(`Added ${restaurants.length} restaurants to poll ${slug}`);
  } catch (error) {
    console.error(`Error creating poll for ${location}:`, error);
    throw error;
  }
}

async function populateMultipleLocations(
  locations: Array<{ location: string; slug: string }>
): Promise<void> {
  for (const { location, slug } of locations) {
    try {
      await createPollWithRestaurants(location, slug);
      // Add a small delay to avoid hitting API rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to populate ${location}:`, error);
    }
  }
}

async function main() {
  try {
    const restaurants = await searchRestaurants("San Francisco, CA", 20);

    const restaurantData = restaurants.map((restaurant) => ({
      name: restaurant.name || "Unknown Restaurant",
      location: restaurant.formatted_address || "Unknown Location",
    }));

    await prisma.restaurant.createMany({
      data: restaurantData,
    });

    // Example: Create a poll for restaurants in San Francisco
    await createPollWithRestaurants("San Francisco, CA", "sf-restaurants-2024");

    // Example: Populate multiple locations
    const locations = [
      { location: "New York, NY", slug: "nyc-restaurants-2024" },
      { location: "Los Angeles, CA", slug: "la-restaurants-2024" },
      { location: "Chicago, IL", slug: "chicago-restaurants-2024" },
    ];

    await populateMultipleLocations(locations);

    console.log("Database population completed!");
  } catch (error) {
    console.error("Error during population:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
