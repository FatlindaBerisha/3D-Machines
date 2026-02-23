using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingCutJobFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OperationType",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Passes",
                table: "CutJobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Thickness",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OperationType",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "Passes",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "Thickness",
                table: "CutJobs");
        }
    }
}
