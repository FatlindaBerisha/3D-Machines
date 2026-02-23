using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddPrintJobPauseSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastResumedAt",
                table: "PrintJobs",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastResumedAt",
                table: "PrintJobs");
        }
    }
}
