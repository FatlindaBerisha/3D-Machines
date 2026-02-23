using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailChangeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailChangeToken",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailChangeTokenExpiry",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PendingEmail",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailChangeToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailChangeTokenExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PendingEmail",
                table: "Users");
        }
    }
}
