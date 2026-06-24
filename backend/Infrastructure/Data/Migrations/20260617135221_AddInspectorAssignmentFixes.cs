using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInspectorAssignmentFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PickupAssignmentRetries",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReturnAssignmentRetries",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ReturnInspectorId",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ReturnInspectorId",
                table: "Bookings",
                column: "ReturnInspectorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_AspNetUsers_ReturnInspectorId",
                table: "Bookings",
                column: "ReturnInspectorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_AspNetUsers_ReturnInspectorId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_ReturnInspectorId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PickupAssignmentRetries",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ReturnAssignmentRetries",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ReturnInspectorId",
                table: "Bookings");
        }
    }
}
