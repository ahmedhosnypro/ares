import { Card, CardContent, Typography, Box, Stack } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";

interface VehiclesPerCategoryCardProps {
  readonly data?: Record<string, number>;
}

export default function VehiclesPerCategoryCard({ data }: VehiclesPerCategoryCardProps) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
        height: "100%",
      })}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
          }}
        >
          <CategoryIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Vehicles Per Category
          </Typography>
        </Box>
        
        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No categories available.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {entries.map(([categoryName, count]) => (
              <Box
                key={categoryName}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {categoryName}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  {count} {count === 1 ? "Vehicle" : "Vehicles"}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
