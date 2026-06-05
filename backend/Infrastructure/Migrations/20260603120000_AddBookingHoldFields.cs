using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <summary>
    /// Adds the time-boxed vehicle-hold columns used by the staged checkout
    /// lifecycle (PaymentPending → Confirmed / Expired) plus the supporting
    /// indexes that make availability checks, hold-expiry sweeps and
    /// booking-recovery lookups fast.
    /// </summary>
    /// <inheritdoc />
    public partial class AddBookingHoldFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<System.DateTime>(
                name: "HoldStartedAt",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<System.DateTime>(
                name: "HoldExpiresAt",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Vehicle_Status_Window",
                table: "Bookings",
                columns: new[] { "VehicleId", "Status", "PickupDate", "ReturnDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Status_HoldExpiresAt",
                table: "Bookings",
                columns: new[] { "Status", "HoldExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_User_Status",
                table: "Bookings",
                columns: new[] { "UserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_User_Status",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Status_HoldExpiresAt",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Vehicle_Status_Window",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HoldExpiresAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HoldStartedAt",
                table: "Bookings");
        }
    }
}
