"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Search as SearchIcon, Save as SaveIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// --- Types ---
interface Location {
  _id: string;
  name: string;
}
interface Supplier {
  _id: string;
  fullName: string;
}
interface Car {
  _id: string;
  name: string;
  price: number;
}
interface User {
  _id: string;
  fullName: string;
  email?: string;
}

interface ApiResponse<T> {
  resultData?: T;
  data?: T;
  items?: T;
}

export default function CreateBookingClient() {
  const router = useRouter();
  const { data: session } = useSession();

  // Form State
  const [formData, setFormData] = useState({
    supplier: "",
    pickupLocation: "",
    dropOffLocation: "",
    from: "",
    to: "",
    car: "",
    driver: "",
    price: 0,
    status: "Pending",
    payLater: false,
  });

  // Data States
  const [locations, setLocations] = useState<readonly Location[]>([]);
  const [suppliers, setSuppliers] = useState<readonly Supplier[]>([]);
  const [cars, setCars] = useState<readonly Car[]>([]);
  const [users, setUsers] = useState<readonly User[]>([]);

  // UI States
  const [userKeyword, setUserKeyword] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Load (Locations & Suppliers)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!session?.accessToken) return;
      try {
        const [locRes, supRes] = await Promise.all([
          apiFetchJson<ApiResponse<Location[]>>("api/locations/1/100/en", { accessToken: session.accessToken }),
          apiFetchJson<Supplier[]>("api/admin-suppliers", {
            method: "POST",
            accessToken: session.accessToken,
            body: JSON.stringify({ user: session.user.id }),
          }),
        ]);
        setLocations(locRes.resultData ?? []);
        setSuppliers(supRes);
      } catch (error) {
        logger.error("Failed to load initial data:", error);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    void fetchInitialData();
  }, [session]);

  // 2. Fetch Cars when supplier/dates/locations change
  const fetchAvailableCars = useCallback(async () => {
    if (formData.supplier && formData.pickupLocation && formData.from && formData.to && session?.accessToken) {
      setIsLoadingCars(true);
      try {
        const res = await apiFetchJson<ApiResponse<Car[]>>("api/booking-cars/1/50", {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            supplier: formData.supplier,
            pickupLocation: formData.pickupLocation,
            from: new Date(formData.from).toISOString(),
            to: new Date(formData.to).toISOString(),
            language: "en",
          }),
        });
        setCars(res.resultData ?? []);
      } catch (error) {
        logger.error("Failed to load cars:", error);
      } finally {
        setIsLoadingCars(false);
      }
    }
  }, [formData.supplier, formData.pickupLocation, formData.from, formData.to, session?.accessToken]);

  useEffect(() => {
    void fetchAvailableCars();
  }, [fetchAvailableCars]);

  // 3. Search Users
  const handleSearchUser = async () => {
    if (!userKeyword.trim() || !session?.accessToken) return;
    setIsSearchingUsers(true);
    try {
      const res = await apiFetchJson<ApiResponse<User[]>>("api/users/1/50", {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({ keyword: userKeyword, types: ["user"] }),
      });
      setUsers(res.resultData ?? []);
    } catch (error) {
      logger.error("User search failed:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedCarId = e.target.value;
    const selectedCar = cars.find(c => c._id === selectedCarId);
    setFormData(prev => ({
      ...prev,
      car: selectedCarId,
      price: selectedCar ? selectedCar.price : prev.price,
    }));
  };

  // Submit Create
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        from: new Date(formData.from).toISOString(),
        to: new Date(formData.to).toISOString(),
        price: formData.price,
      };

      await apiFetchJson("api/create-booking", {
        method: "POST",
        accessToken: session?.accessToken,
        body: JSON.stringify(payload),
      });

      alert("Booking created successfully!");
      router.push("/admin/bookings");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create booking.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paperSx = {
    p: 3,
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 3,
    bgcolor: "background.paper",
  };

  if (isLoadingInitial) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <IconButton
          onClick={() => {
            router.push("/admin/bookings");
          }}
          sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Create New Booking
        </Typography>
      </Box>

      <form
        onSubmit={e => {
          void handleSubmit(e);
        }}
      >
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Dates & Locations */}
          <Paper elevation={0} sx={paperSx}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }} color="primary.main">
              📍 Dates & Locations
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Pickup Location"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                fullWidth
              >
                {locations.map(loc => (
                  <MenuItem key={loc._id} value={loc._id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Drop-off Location"
                name="dropOffLocation"
                value={formData.dropOffLocation}
                onChange={handleChange}
                required
                fullWidth
              >
                {locations.map(loc => (
                  <MenuItem key={loc._id} value={loc._id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="datetime-local"
                label="From Date"
                name="from"
                value={formData.from}
                onChange={handleChange}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="datetime-local"
                label="To Date"
                name="to"
                value={formData.to}
                onChange={handleChange}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Paper>

          {/* Section 2: Vehicle & Supplier */}
          <Paper elevation={0} sx={paperSx}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }} color="primary.main">
              🚗 Vehicle Details
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                fullWidth
              >
                {suppliers.map(sup => (
                  <MenuItem key={sup._id} value={sup._id}>
                    {sup.fullName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label={isLoadingCars ? "Loading cars..." : "Select Car"}
                name="car"
                value={formData.car}
                onChange={handleCarChange}
                required
                fullWidth
                disabled={!cars.length || isLoadingCars}
              >
                {cars.map(car => (
                  <MenuItem key={car._id} value={car._id}>
                    {car.name} - ${car.price}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {/* Section 3: Driver Details */}
          <Paper elevation={0} sx={paperSx}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }} color="primary.main">
              👤 Driver Assignment
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                label="Search by name or email"
                value={userKeyword}
                onChange={e => {
                  setUserKeyword(e.target.value);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSearchUser();
                  }
                }}
                fullWidth
                size="small"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  void handleSearchUser();
                }}
                disabled={isSearchingUsers}
                sx={{ minWidth: 100 }}
              >
                {isSearchingUsers ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
              </Button>
            </Box>
            <TextField
              select
              label="Select Driver"
              name="driver"
              value={formData.driver}
              onChange={handleChange}
              required
              fullWidth
              slotProps={{ select: { native: true } }}
            >
              <option value="" disabled>
                Search results...
              </option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.fullName} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </TextField>
          </Paper>

          {/* Section 4: Payment & Options */}
          <Paper
            elevation={0}
            sx={{ ...paperSx, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }} color="primary.main">
                💳 Payment & Options
              </Typography>
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <TextField
                  type="number"
                  label="Total Price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    },
                  }}
                />
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {["Pending", "Deposit", "Paid", "Reserved"].map(s => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ display: "flex", gap: 4 }}>
                <FormControlLabel
                  control={<Checkbox name="payLater" checked={formData.payLater} onChange={handleChange} />}
                  label="Pay Later"
                />
              </Box>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold" }}
              >
                {isSubmitting ? "Creating Booking..." : "Confirm & Create Booking"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </form>
    </Container>
  );
}
