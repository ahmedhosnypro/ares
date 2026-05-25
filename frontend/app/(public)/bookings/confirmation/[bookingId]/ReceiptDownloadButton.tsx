"use client";

import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useSession } from "next-auth/react";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface Props {
  readonly transactionId: string;
}

export default function ReceiptDownloadButton({ transactionId }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(toApiUrl(`/api/v1/payments/${transactionId}/receipt`), {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to download receipt");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${transactionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Receipt download failed", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="contained"
      size="large"
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ReceiptIcon />}
      onClick={() => {
        void handleDownload();
      }}
      disabled={loading}
      sx={{ borderRadius: 2, py: 1.5, px: 4, fontWeight: 700 }}
    >
      Download Receipt
    </Button>
  );
}
