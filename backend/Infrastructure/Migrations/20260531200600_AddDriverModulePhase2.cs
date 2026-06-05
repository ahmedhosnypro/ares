using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverModulePhase2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedDriverProfileId",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DriverFee",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DriverLockedUntil",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "GrandTotal",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VehicleFee",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "driver_reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_reviews_AspNetUsers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_driver_reviews_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_driver_reviews_driver_profiles_DriverProfileId",
                        column: x => x.DriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "service_areas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Governorate = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_areas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "driver_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PickupServiceAreaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PickupLocationText = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FulfilledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FulfilledByDriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_requests_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_driver_requests_driver_profiles_FulfilledByDriverProfileId",
                        column: x => x.FulfilledByDriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_driver_requests_service_areas_PickupServiceAreaId",
                        column: x => x.PickupServiceAreaId,
                        principalTable: "service_areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "driver_work_areas",
                columns: table => new
                {
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServiceAreaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_work_areas", x => new { x.DriverProfileId, x.ServiceAreaId });
                    table.ForeignKey(
                        name: "FK_driver_work_areas_driver_profiles_DriverProfileId",
                        column: x => x.DriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_driver_work_areas_service_areas_ServiceAreaId",
                        column: x => x.ServiceAreaId,
                        principalTable: "service_areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "driver_request_responses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_request_responses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_request_responses_driver_profiles_DriverProfileId",
                        column: x => x.DriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_driver_request_responses_driver_requests_DriverRequestId",
                        column: x => x.DriverRequestId,
                        principalTable: "driver_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AssignedDriverProfileId",
                table: "Bookings",
                column: "AssignedDriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AssignedDriverProfileId_PickupDate_ReturnDate",
                table: "Bookings",
                columns: new[] { "AssignedDriverProfileId", "PickupDate", "ReturnDate" });

            migrationBuilder.CreateIndex(
                name: "IX_driver_request_responses_DriverProfileId",
                table: "driver_request_responses",
                column: "DriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_request_responses_DriverRequestId_DriverProfileId",
                table: "driver_request_responses",
                columns: new[] { "DriverRequestId", "DriverProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_driver_requests_BookingId",
                table: "driver_requests",
                column: "BookingId",
                unique: true,
                filter: "[Status] = 'Open'");

            migrationBuilder.CreateIndex(
                name: "IX_driver_requests_FulfilledByDriverProfileId",
                table: "driver_requests",
                column: "FulfilledByDriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_requests_PickupServiceAreaId",
                table: "driver_requests",
                column: "PickupServiceAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_requests_Status_ExpiresAt",
                table: "driver_requests",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_driver_reviews_BookingId",
                table: "driver_reviews",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_driver_reviews_CustomerId",
                table: "driver_reviews",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_reviews_DriverProfileId",
                table: "driver_reviews",
                column: "DriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_work_areas_ServiceAreaId",
                table: "driver_work_areas",
                column: "ServiceAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_service_areas_Name",
                table: "service_areas",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_driver_profiles_AssignedDriverProfileId",
                table: "Bookings",
                column: "AssignedDriverProfileId",
                principalTable: "driver_profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_driver_profiles_AssignedDriverProfileId",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "driver_request_responses");

            migrationBuilder.DropTable(
                name: "driver_reviews");

            migrationBuilder.DropTable(
                name: "driver_work_areas");

            migrationBuilder.DropTable(
                name: "driver_requests");

            migrationBuilder.DropTable(
                name: "service_areas");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_AssignedDriverProfileId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_AssignedDriverProfileId_PickupDate_ReturnDate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "AssignedDriverProfileId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DriverFee",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DriverLockedUntil",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "GrandTotal",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "VehicleFee",
                table: "Bookings");
        }
    }
}
