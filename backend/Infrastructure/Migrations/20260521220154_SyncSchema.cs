using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSubmitted",
                table: "VehicleInspections",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "VehicleInspections",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "VehicleInspections",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedInspectorId",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InspectionStatus",
                table: "Bookings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NotRequired");

            migrationBuilder.CreateTable(
                name: "InspectionImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InspectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InspectionImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InspectionImages_VehicleInspections_InspectionId",
                        column: x => x.InspectionId,
                        principalTable: "VehicleInspections",
                        principalColumn: "InspectionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AssignedInspectorId",
                table: "Bookings",
                column: "AssignedInspectorId");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionImages_InspectionId",
                table: "InspectionImages",
                column: "InspectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_AspNetUsers_AssignedInspectorId",
                table: "Bookings",
                column: "AssignedInspectorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_AspNetUsers_AssignedInspectorId",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "InspectionImages");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_AssignedInspectorId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "IsSubmitted",
                table: "VehicleInspections");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "VehicleInspections");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "VehicleInspections");

            migrationBuilder.DropColumn(
                name: "AssignedInspectorId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "InspectionStatus",
                table: "Bookings");
        }
    }
}
