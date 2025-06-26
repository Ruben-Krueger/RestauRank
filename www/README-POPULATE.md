# Restaurant Database Population Tools

This project provides tools to populate your database with restaurants from the Google Places API.

## Prerequisites

1. **Google Places API Key**: Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Places API and Geocoding API
   - Create credentials (API Key)
2. **Environment Variables**: Add your Google Places API key to your `.env` file:
   ```
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   DATABASE_URL=your_database_url_here
   ```

## Features

- Command-line tool for batch population
- Can populate multiple locations at once
- Rate limiting protection
- Error handling and logging
- Uses Google Places API for accurate restaurant data

## Usage

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Generate Prisma client**:

   ```bash
   npx prisma generate
   ```

3. **Run the script**:
   ```bash
   npm run populate
   ```

### Customizing the Script

Edit `scripts/populate-restaurants.ts` to modify:

- Default locations
- Number of restaurants per poll
- Rate limiting delays
- Error handling logic

### Example Usage in Code

```typescript
import {
  searchRestaurants,
  createPollWithRestaurants,
  populateMultipleLocations,
} from "./scripts/populate-restaurants";

// Create a single poll
await createPollWithRestaurants("San Francisco, CA", "sf-restaurants-2024");

// Create multiple polls
const locations = [
  { location: "New York, NY", slug: "nyc-restaurants-2024" },
  { location: "Los Angeles, CA", slug: "la-restaurants-2024" },
];
await populateMultipleLocations(locations);
```

## API Features

The script uses the following Google Places API features:

- **Geocoding**: Converts location names to coordinates
- **Places Nearby**: Finds restaurants within a 5km radius
- **Place Details**: Gets detailed information for each restaurant including:
  - Name and address
  - Rating and review count
  - Price level
  - Business types

## Rate Limiting

The script includes built-in rate limiting with 1-second delays between API calls to avoid hitting Google's rate limits.
