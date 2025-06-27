import { getDB } from "../src/utils/db";
import { Client, PlaceType1, Place } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
import nullThrows from "nullthrows";
dotenv.config();

const prisma = getDB();

async function delay(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function* genPaginate(
  client: Client,
  params: {
    location: { lat: number; lng: number };
    radius: number;
    type: PlaceType1;
    key: string;
  },
  maxPages: number = 5
): AsyncGenerator<Place[], void, unknown> {
  let nextPageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const placesResponse = await client.placesNearby({
      params: {
        ...params,
        ...(nextPageToken && { pagetoken: nextPageToken }),
      },
    });

    if (placesResponse.data.status !== "OK") {
      throw new Error(`Places API error: ${placesResponse.data.status}`);
    }

    const results = placesResponse.data.results;
    yield results;

    // Check if there are more pages
    nextPageToken = placesResponse.data.next_page_token;

    // If no more pages, break
    if (!nextPageToken) {
      break;
    }

    // Google requires a short delay before using the next_page_token
    if (page < maxPages - 1) {
      // Don't delay after the last page
      await delay(2000); // 2 second delay
    }
  }
}

async function searchRestaurants(location: string): Promise<Place[]> {
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

    let allResults: Place[] = [];

    // Use the pagination generator to get all results
    for await (const results of genPaginate(client, {
      location: { lat, lng },
      radius: 10000, // 5km radius
      type: PlaceType1.restaurant,
      key: apiKey,
    })) {
      allResults = allResults.concat(results);
    }

    const filteredResults = allResults.filter(
      (r) => r.name != null && r.place_id != null
    );

    return filteredResults;
  } catch (error) {
    console.error("Error fetching restaurants from Google Places:", error);
    throw error;
  }
}

async function main() {
  try {
    const restaurants = await searchRestaurants("San Francisco, CA");

    console.log(`Found ${restaurants.length} restaurants`);

    return;

    // Use upsert to prevent duplicates based on place_id
    for (const restaurant of restaurants) {
      await prisma.restaurant.upsert({
        where: { placeId: restaurant.place_id! },
        update: {
          name: restaurant.name!,
          location: restaurant.formatted_address!,
        },
        create: {
          name: restaurant.name!,
          location: restaurant.formatted_address!,
          placeId: restaurant.place_id!,
        },
      });
    }

    console.log("Database population completed!");
  } catch (error) {
    console.error("Error during population:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
