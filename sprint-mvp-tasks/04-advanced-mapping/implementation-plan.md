# Advanced Mapping Implementation Plan

## Associated Documentation
Please refer to the detailed specification documents copied in this directory for exact requirements:
- [Backend Specs](./backend)
- [Frontend Specs](./frontend)

## Current State (Gap Analysis)
The frontend uses basic `react-leaflet` to display destinations (points on a map). It lacks advanced features like routing, distance calculation, geocoding validation, map-bound based searching, and "Use My Location" functionality. The backend has a `LocationService.cs` but lacks secure mapping API key management, caching, and explicit error handling/fallbacks for mapping failures.

## Implementation Steps

### Backend Tasks (.NET 8)
1. **API Key Management:** Move mapping API keys (e.g., Google Maps, Mapbox) into a secure Key Vault or environment variable setup. Implement a proxy endpoint so the frontend does not expose raw keys.
2. **Geocoding & Validation Endpoint:** Add a backend proxy for geocoding services to validate addresses securely and cache the results to save costs.
3. **Distance Calculation Service:** Implement a backend service to calculate driving distance/time between a customer and a vehicle pickup location using a Routing API.
4. **Caching & Fallbacks:** Add caching (Redis/Memory) for frequent mapping requests (like popular cities) and implement retry/fallback logic if the primary mapping provider goes down.

### Frontend Tasks (Next.js)
1. **Geolocation & Permissions:** Implement a "Use My Location" button that securely requests the browser's Geolocation API and centers the map/search context.
2. **Map-Based Searching:** Enhance the `react-leaflet` map to allow users to draw bounds or pan the map to dynamically refetch vehicles within that bounding box.
3. **Distance Display:** Show real-time distance and estimated driving time to vehicles in the search results based on the user's location.
4. **Address Autocomplete:** Upgrade text inputs for locations to use robust geocoding autocomplete (e.g., Google Places Autocomplete or Mapbox Geocoding) rather than just database queries.
