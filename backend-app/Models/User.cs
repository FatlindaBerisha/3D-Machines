public class User
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Profession { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Gender { get; set; }
    public string Role { get; set; } = "user";
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public DateTime? RefreshTokenCreated { get; set; }
    public DateTime? RefreshTokenRevoked { get; set; }

    public string? VerificationToken { get; set; }
    public DateTime? VerificationTokenExpiry { get; set; }
    public bool IsEmailVerified { get; set; }

    public int AccessFailedCount { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }
    public int LockoutCount { get; set; } = 0;

    // Email Change Fields
    public string? PendingEmail { get; set; }
    public string? EmailChangeToken { get; set; }
    public DateTime? EmailChangeTokenExpiry { get; set; }
    public string PreferredLanguage { get; set; } = "en";
}
