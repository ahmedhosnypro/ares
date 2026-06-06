# Availability Search & Business Rules Implementation Plan

## Associated Documentation
Please refer to the detailed specification documents copied in this directory for exact requirements:
- [Backend Specs](./backend)
- [Frontend Specs](./frontend)
- [Database Specs](./database)

## Current State (Gap Analysis)
Vehicle searching works, but the backend lacks strict enforcement of complex business rules like buffer times between bookings (e.g., 2 hours for cleaning), minimum/maximum rental periods per vehicle, and precise time-interval validations. The frontend date pickers do not visually block out these complex un-bookable slots effectively.

## Implementation Steps

### Backend Tasks (.NET 8)
1. **Buffer Time Engine:** Update the availability queries in `BookingService.cs` and `VehicleService.cs` to account for a dynamic "prep/buffer time" defined by the supplier or system defaults.
2. **Rental Period Validation:** Implement strict validation checks to reject bookings that violate a vehicle's specific minimum/maximum rental duration rules.
3. **Real-time Availability Endpoint:** Refine the API that returns a vehicle's calendar to accurately reflect precise hours of unavailability (including buffer times), not just full days.
4. **Database Models:** Update the `Vehicles` or `SupplierSettings` tables to include configurable buffer times and min/max duration constraints.

### Frontend Tasks (Next.js)
1. **Advanced Date/Time Pickers:** Upgrade the booking date/time pickers to visually disable specific hours or days based on the backend's real-time availability calendar.
2. **Validation Feedback:** Provide instant, clear UI feedback if a user selects a range that violates the minimum/maximum duration rules or encroaches on a buffer window.
3. **Time Pickers Intervals:** Enforce configurable time intervals (e.g., locking selections to 30-minute or 1-hour increments) to simplify scheduling and alignment with business rules.
