using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260601120000_AddDriverProfileRowVersion")]
    public partial class AddDriverProfileRowVersion
    {
    }

    /// <summary>Migration body (Up/Down) for the rowversion column.</summary>
    /// <summary>
    /// Adds an optimistic-concurrency <c>rowversion</c> token to
    /// <c>driver_profiles</c>. This serializes concurrent driver-assignment
    /// operations (select / change / cancel) on the same driver: the second
    /// commit fails with a concurrency exception instead of producing a
    /// double assignment or overlapping reservation.
    ///
    /// Additive and backward-compatible: SQL Server auto-populates the
    /// rowversion for existing rows, so no data backfill is required.
    /// </summary>
    public partial class AddDriverProfileRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "driver_profiles",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "driver_requests",
                type: "rowversion",
                rowVersion: true,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "driver_requests");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "driver_profiles");
        }
    }
}
