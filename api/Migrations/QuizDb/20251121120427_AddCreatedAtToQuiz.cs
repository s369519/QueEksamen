using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations.QuizDb
{
    /// <inheritdoc />
    public partial class AddCreatedAtToQuiz : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Quizes",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Quizes",
                keyColumn: "QuizId",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 11, 21, 12, 4, 26, 918, DateTimeKind.Utc).AddTicks(8010));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Quizes");
        }
    }
}
