// app/admin/components/StatsGrid.tsx
"use client";

import { Grid } from "@mui/material";
import { motion } from "framer-motion";
import StatCard from "./StatCard";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function StatsGrid({ stats }: { stats: any[] }) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div variants={itemVariants}>
            <StatCard {...stat} />
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}