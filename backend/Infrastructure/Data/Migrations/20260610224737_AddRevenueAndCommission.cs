using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRevenueAndCommission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "driver_request_responses");

            migrationBuilder.DropTable(
                name: "driver_requests");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Vehicles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "InspectorId",
                table: "VehicleInspections",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "Region",
                table: "Inspectors",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionAmount",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionPercentage",
                table: "Bookings",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SupplierAmount",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CommissionPercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    DiscountPercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CategoryId",
                table: "Vehicles",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Categories_CategoryId",
                table: "Vehicles",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Categories_CategoryId",
                table: "Vehicles");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CategoryId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "Region",
                table: "Inspectors");

            migrationBuilder.DropColumn(
                name: "CommissionAmount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CommissionPercentage",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SupplierAmount",
                table: "Bookings");

            migrationBuilder.AlterColumn<Guid>(
                name: "InspectorId",
                table: "VehicleInspections",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "driver_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FulfilledByDriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PickupServiceAreaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FulfilledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PickupLocationText = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
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
                name: "driver_request_responses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
        }
    }
}
