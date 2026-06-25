import { Box } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import BadgeIcon from "@mui/icons-material/Badge";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { StatCard } from "../../_components/VehicleStats";

export interface SummaryItem {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  color: "primary" | "success" | "warning" | "error" | "info" | "secondary";
  iconName:
    | "Storefront"
    | "DirectionsCar"
    | "AttachMoney"
    | "PeopleAlt"
    | "EventAvailable"
    | "GppMaybe"
    | "PersonOutlined"
    | "BuildCircle"
    | "Badge"
    | "Category"
    | "LocalOffer";
}

const IconMap = {
  Storefront: StorefrontIcon,
  DirectionsCar: DirectionsCarIcon,
  AttachMoney: AttachMoneyIcon,
  PeopleAlt: PeopleAltIcon,
  EventAvailable: EventAvailableIcon,
  GppMaybe: GppMaybeIcon,
  PersonOutlined: PersonOutlinedIcon,
  BuildCircle: BuildCircleIcon,
  Badge: BadgeIcon,
  Category: CategoryIcon,
  LocalOffer: LocalOfferIcon,
};

export default function StatCardGrid({ items }: { readonly items: readonly SummaryItem[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(1, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        },
        gap: 3,
        mb: 4,
        width: "100%",
      }}
    >
      {items.map((stat, i) => {
        const Icon = IconMap[stat.iconName];

        return (
          <Box key={i} sx={{ minWidth: 0, height: "100%" }}>
            <StatCard
              label={stat.title}
              value={stat.value}
              change={stat.change}
              isUp={stat.isUp}
              color={stat.color}
              icon={<Icon />}
            />
          </Box>
        );
      })}
    </Box>
  );
}
