using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferredLanguageToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CutJobs_Users_UserId",
                table: "CutJobs");

            migrationBuilder.DropForeignKey(
                name: "FK_PrintJobs_Users_UserId",
                table: "PrintJobs");

            migrationBuilder.AddColumn<string>(
                name: "PreferredLanguage",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_CutJobs_Users_UserId",
                table: "CutJobs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PrintJobs_Users_UserId",
                table: "PrintJobs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CutJobs_Users_UserId",
                table: "CutJobs");

            migrationBuilder.DropForeignKey(
                name: "FK_PrintJobs_Users_UserId",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "PreferredLanguage",
                table: "Users");

            migrationBuilder.AddForeignKey(
                name: "FK_CutJobs_Users_UserId",
                table: "CutJobs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrintJobs_Users_UserId",
                table: "PrintJobs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
