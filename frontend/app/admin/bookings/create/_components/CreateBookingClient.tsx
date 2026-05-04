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
  Alert,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Search as SearchIcon, Save as SaveIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { Location, PaginatedResponse as LocationResponse } from "@/api-clients/locations/locations";
import { Supplier, SupplierResponse } from "@/api-clients/suppliers/suppliers";
import { Vehicle as Car } from "@/api-clients/cars/cars";
import { User } from "@/api-clients/users/users";

// --- Local Response Types if not in api-clients ---
interface CarResponse {
  data?: Car[];
  resultData?: Car[];
}

interface ExtendedUser extends User {
  fullName?: string;
  userName?: string;
}

interface UserResponse {
  data?: ExtendedUser[];
  resultData?: ExtendedUser[];
}

export default function CreateBookingClient() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

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
    additionalDriver: false,
    payLater: false,
  });

  // Data States
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  // User Search States
  const [userKeyword, setUserKeyword] = useState("");
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Loading States
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Initial Data (Locations & Suppliers)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (sessionStatus === "loading") return;
      if (!session?.accessToken) {
        setErrorMsg("Authentication required. Please sign in.");
        setIsLoadingInitial(false);
        return;
      }

      try {
        // جلب المواقع
        const locRes = await apiFetchJson<LocationResponse<Location>>("api/locations/1/100/en", {
          accessToken: session.accessToken,
        });
        setLocations(locRes.resultData);

        // جلب الموردين (استخدام المسار الجديد اللي صلحناه)
        const supRes = await apiFetchJson<SupplierResponse>("api/suppliers/1/100", {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({ keyword: null, types: ["user"] }),
        });

        logger.debug("Suppliers Data", supRes);
        const suppliersData = supRes.data || supRes.items || supRes.resultData || [];
        setSuppliers(suppliersData);
      } catch (error) {
        logger.error("Failed to load initial data", error);
        setErrorMsg("Failed to load initial data. Please try again.");
      } finally {
        setIsLoadingInitial(false);
      }
    };
    void fetchInitialData();
  }, [session, sessionStatus]);

  // 2. Fetch Cars dynamically when dependencies are fulfilled
  const { supplier, pickupLocation, from, to } = formData;

  useEffect(() => {
    // تفريغ العربية والسعر فوراً لو المورد أو التواريخ اتغيرت عشان نتفادى خطأ 409
    setFormData(prev => ({ ...prev, car: "", price: 0 }));

    if (supplier && pickupLocation && from && to && session?.accessToken) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        setCars([]);
        return;
      }

      const fetchAvailableCars = async () => {
        setIsLoadingCars(true);
        try {
          const res = await apiFetchJson<CarResponse>("api/booking-cars/1/50", {
            method: "POST",
            accessToken: session.accessToken,
            body: JSON.stringify({
              supplier,
              pickupLocation,
              from: fromDate.toISOString(),
              to: toDate.toISOString(),
              language: "en",
            }),
          });
          setCars(res.data || res.resultData || []);
        } catch (error) {
          logger.error("Failed to load cars", error);
          setCars([]);
        } finally {
          setIsLoadingCars(false);
        }
      };
      void fetchAvailableCars();
    } else {
      setCars([]);
    }
  }, [supplier, pickupLocation, from, to, session]);

  // 3. Search Users
  const handleSearchUser = async () => {
    if (!userKeyword.trim() || !session?.accessToken) return;
    setIsSearchingUsers(true);
    try {
      const res = await apiFetchJson<UserResponse>("api/users/1/50", {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({ keyword: userKeyword, types: ["user"] }),
      });
      setUsers(res.data || res.resultData || []);
    } catch (error) {
      logger.error("User search failed", error);
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
    const selectedCar = cars.find(c => c.id === selectedCarId);
    setFormData(prev => ({
      ...prev,
      car: selectedCarId,
      price: selectedCar ? selectedCar.pricePerDay || selectedCar.dailyRate || 0 : prev.price,
    }));
  };

  // Submit - POST /api/admin/bookings/create
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.car || !formData.driver) {
      alert("Please select a car and a driver.");
      return;
    }

    const fromDate = new Date(formData.from);
    const toDate = new Date(formData.to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      alert("Please enter valid dates.");
      return;
    }

    if (!session?.accessToken) {
      alert("Session expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        carId: formData.car,
        supplierId: formData.supplier,
        driverId: formData.driver,
        pickupLocationId: formData.pickupLocation,
        dropOffLocationId: formData.dropOffLocation,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        status: formData.status,
        price: formData.price,
        additionalDriver: formData.additionalDriver,
        payLater: formData.payLater,
      };

      await apiFetchJson("api/admin/bookings/create", {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify(payload),
      });

      alert("Booking created successfully!");
      router.push("/admin/bookings");
    } catch (error: unknown) {
      logger.error("Booking creation failed", error);
      const message = error instanceof Error ? error.message : "Failed to create booking.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = useCallback(() => {
    router.push("/admin/bookings");
  }, [router]);

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

  if (errorMsg) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{errorMsg}</Alert>
        <Button
          onClick={() => {
            window.location.reload();
          }}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 2 }}>
        <IconButton
          type="button"
          onClick={handleGoBack}
          sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: "800" }}>
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
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: "bold", mb: 3 }}>
              📍 Dates & Locations
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Pickup Location"
                name="pickupLocation"
                value={formData.pickupLocation || ""}
                onChange={handleChange}
                required
                fullWidth
              >
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name || loc.city || loc.addressLine || "موقع بدون اسم"}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Drop-off Location"
                name="dropOffLocation"
                value={formData.dropOffLocation || ""}
                onChange={handleChange}
                required
                fullWidth
              >
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name || loc.city || loc.addressLine || "موقع بدون اسم"}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="datetime-local"
                label="From Date"
                name="from"
                value={formData.from || ""}
                onChange={handleChange}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="datetime-local"
                label="To Date"
                name="to"
                value={formData.to || ""}
                onChange={handleChange}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Paper>

          {/* Section 2: Vehicle & Supplier */}
          <Paper elevation={0} sx={paperSx}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: "bold", mb: 3 }}>
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
                  <MenuItem key={sup.id} value={sup.id}>
                    {/* 🔥 التعديل هنا: هيقرأ أي اسم متاح من الباك إند */}
                    {sup.fullName ||
                      sup.companyProfile?.companyName ||
                      sup.firstName ||
                      sup.lastName ||
                      "Unknown Supplier"}
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
                helperText={!cars.length && formData.supplier ? "No cars available for selected dates/location" : ""}
              >
                {cars.map(car => (
                  <MenuItem key={car.id} value={car.id}>
                    {car.make} {car.model} - ${car.pricePerDay || car.dailyRate}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {/* Section 3: Driver Details */}
          <Paper elevation={0} sx={paperSx}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: "bold", mb: 3 }}>
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
                type="button"
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

            {/* 🔥 التعديل هنا: لغينا الـ native واستخدمنا MenuItem عشان التنسيق ميبوظش */}
            <TextField
              select
              label="Select Driver"
              name="driver"
              value={formData.driver}
              onChange={handleChange}
              required
              fullWidth
            >
              {users.length === 0 && (
                <MenuItem value="" disabled>
                  Search results will appear here...
                </MenuItem>
              )}
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName || u.lastName || u.fullName || u.userName || "Unknown"} ({u.email})
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          {/* Section 4: Payment & Options */}
          <Paper
            elevation={0}
            sx={{ ...paperSx, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: "bold", mb: 3 }}>
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
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
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
                  {["Pending", "Confirmed", "Active", "Completed", "Cancelled"].map(s => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ display: "flex", gap: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox name="additionalDriver" checked={formData.additionalDriver} onChange={handleChange} />
                  }
                  label="Additional Driver"
                />
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
