using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorBookingStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DriverAssignmentStatus",
                table: "Bookings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NotRequired");

            migrationBuilder.Sql(@"
                -- 1. Map 'Pending'
                UPDATE [Bookings] SET [Status] = 'PaymentPending' WHERE [Status] = 'Pending';
                
                -- 2. Map driver-related statuses
                UPDATE [Bookings] SET [DriverAssignmentStatus] = 'Wait', [Status] = 'Confirmed' WHERE [Status] = 'WaitingForDriver';
                UPDATE [Bookings] SET [DriverAssignmentStatus] = 'Failed', [Status] = 'Confirmed' WHERE [Status] = 'NoDriverAvailable';
                UPDATE [Bookings] SET [DriverAssignmentStatus] = 'Assigned', [Status] = 'Confirmed' WHERE [Status] = 'DriverSelected';
                
                -- 3. Map inspection and supplier approval statuses
                UPDATE [Bookings] SET [Status] = 'Completed' WHERE [Status] = 'InspectionFailed';
                UPDATE [Bookings] SET [Status] = 'Confirmed' WHERE [Status] IN ('Approved', 'ReadyForDelivery');
                
                -- 4. Fix up DriverAssignmentStatus for historical assigned bookings
                UPDATE [Bookings] SET [DriverAssignmentStatus] = 'Assigned' WHERE [RequiresDriver] = 1 AND [Status] IN ('Active', 'Completed');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DriverAssignmentStatus",
                table: "Bookings");
        }
    }
}
