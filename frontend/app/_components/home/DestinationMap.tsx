"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box, Typography, Button, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";

// Fix leaflet default icon path issues with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for rental locations
const createCustomIcon = (markerColor: string, iconColor: string, borderColor: string, shadowColor: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${markerColor};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid ${borderColor};
        box-shadow: 0 2px 8px ${shadowColor};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg style="transform: rotate(45deg); width: 16px; height: 16px; fill: ${iconColor};" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Geocoding helper - maps cities to coordinates
const getCityCoordinates = (city: string, _country: string): [number, number] | null => {
  const locationMap: Record<string, [number, number] | undefined> = {
    // Egypt
    Cairo: [30.0444, 31.2357],
    Alexandria: [31.2001, 29.9187],
    Giza: [30.0131, 31.2089],
    "Shubra El Kheima": [30.1286, 31.2422],
    "Port Said": [31.2653, 32.3019],
    Suez: [29.9668, 32.5498],
    Luxor: [25.6872, 32.6396],
    Aswan: [24.0889, 32.8998],
    Mansoura: [31.0409, 31.3785],
    Tanta: [30.7865, 31.0004],
    Asyut: [27.1809, 31.1837],
    Ismailia: [30.5903, 32.2654],
    Faiyum: [29.3084, 30.8428],
    Zagazig: [30.5877, 31.5022],
    Damietta: [31.4175, 31.8144],
    Ashmoun: [30.2981, 30.9776],
    Qena: [26.1551, 32.716],
    Sohag: [26.5569, 31.6948],
    Hurghada: [27.2579, 33.8116],
    "Sharm El Sheikh": [27.9158, 34.33],

    // USA
    "New York": [40.7128, -74.006],
    "Los Angeles": [34.0522, -118.2437],
    Chicago: [41.8781, -87.6298],
    Houston: [29.7604, -95.3698],
    Phoenix: [33.4484, -112.074],
    Philadelphia: [39.9526, -75.1652],
    "San Antonio": [29.4241, -98.4936],
    "San Diego": [32.7157, -117.1611],
    Dallas: [32.7767, -96.797],
    "San Jose": [37.3382, -121.8863],
    Miami: [25.7617, -80.1918],
    Boston: [42.3601, -71.0589],
    Seattle: [47.6062, -122.3321],
    Denver: [39.7392, -104.9903],
    "Las Vegas": [36.1699, -115.1398],

    // UK
    London: [51.5074, -0.1278],
    Manchester: [53.4808, -2.2426],
    Birmingham: [52.4862, -1.8904],
    Leeds: [53.8008, -1.5491],
    Glasgow: [55.8642, -4.2518],

    // Other major cities
    Paris: [48.8566, 2.3522],
    Berlin: [52.52, 13.405],
    Madrid: [40.4168, -3.7038],
    Rome: [41.9028, 12.4964],
    Dubai: [25.2048, 55.2708],
    Tokyo: [35.6762, 139.6503],
    Sydney: [-33.8688, 151.2093],
    Toronto: [43.6532, -79.3832],
  };

  // Try exact match first
  const coords = locationMap[city];
  if (coords) {
    return coords;
  }

  // Try case-insensitive match
  const cityLower = city.toLowerCase();
  for (const [key, coords] of Object.entries(locationMap)) {
    if (key.toLowerCase() === cityLower && coords) {
      return coords;
    }
  }

  return null;
};

// Component to fit map bounds to markers
function FitBounds({
  locations,
}: {
  readonly locations: ReadonlyArray<{ readonly coords: readonly [number, number] }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [...loc.coords] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [locations, map]);

  return null;
}

interface Location {
  id: string;
  city?: string;
  country?: string;
  governorate?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
}

interface DestinationMapProps {
  readonly locations: readonly Location[];
}

export default function DestinationMap({ locations }: DestinationMapProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const tileLayerConfig = useMemo(() => {
    if (isDarkMode) {
      return {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      };
    }

    return {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    };
  }, [isDarkMode]);

  const mapMarkerIcon = useMemo(
    () =>
      createCustomIcon(
        theme.palette.primary.main,
        theme.palette.primary.contrastText,
        theme.palette.background.paper,
        theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.3)"
      ),
    [theme.palette.background.paper, theme.palette.mode, theme.palette.primary.contrastText, theme.palette.primary.main]
  );

  // Process locations and add coordinates
  const mappedLocations = useMemo(() => {
    return locations
      .map(loc => {
        const hasApiCoords = typeof loc.latitude === "number" && typeof loc.longitude === "number";
        const coords = hasApiCoords
          ? ([loc.latitude, loc.longitude] as [number, number])
          : getCityCoordinates(loc.city || "", loc.country || "");

        if (!coords) return null;

        return {
          ...loc,
          coords,
        };
      })
      .filter((loc): loc is typeof loc & { coords: [number, number] } => loc !== null);
  }, [locations]);

  // Default center (Cairo, Egypt - assuming ARES is Egypt-based)
  const defaultCenter: [number, number] = [30.0444, 31.2357];
  const defaultZoom = mappedLocations.length === 0 ? 6 : 4;

  return (
    <Box
      sx={{
        height: { xs: 400, md: 500 }, // Increased from 400px for better discovery
        width: "100%",
        borderRadius: 1.5, // Reduced from 4 (32px) to 1.5 (12px) - structured, not pill
        overflow: "hidden", // Ensures map respects border radius
        border: "1px solid",
        borderColor: "divider",
        boxShadow: 2,
        "& .leaflet-control-zoom": {
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        },
        "& .leaflet-control-zoom a": {
          bgcolor: "background.paper",
          color: "text.primary",
          borderColor: "divider",
          width: 34,
          height: 34,
          lineHeight: "34px",
          fontWeight: 700,
        },
        "& .leaflet-control-zoom a:hover": {
          bgcolor: "action.hover",
          color: "primary.main",
        },
        "& .leaflet-control-zoom a.leaflet-disabled": {
          bgcolor: "action.disabledBackground",
          color: "text.disabled",
        },
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer attribution={tileLayerConfig.attribution} url={tileLayerConfig.url} />

        {mappedLocations.length > 0 && <FitBounds locations={mappedLocations} />}

        {/* Render all location markers */}
        {mappedLocations.map(loc => (
          <Marker key={loc.id} position={loc.coords} icon={mapMarkerIcon}>
            <Popup maxWidth={300}>
              <Box sx={{ p: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {loc.city}
                </Typography>
                {loc.governorate && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {loc.governorate}, {loc.country}
                  </Typography>
                )}
                {loc.addressLine && (
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    {loc.addressLine}
                  </Typography>
                )}
                <Chip label="Available" color="success" size="small" sx={{ mb: 2 }} />
                <Button
                  size="small"
                  variant="contained"
                  component={Link}
                  href={`/search?pickupLocationId=${loc.id}`}
                  fullWidth
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: "bold",
                    textTransform: "none",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      bgcolor: "primary.dark",
                      color: "primary.contrastText",
                    },
                  }}
                >
                  View Vehicles
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
