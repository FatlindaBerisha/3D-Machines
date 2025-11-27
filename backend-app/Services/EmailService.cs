using backend_app.Models;
using Microsoft.Extensions.Options;
using System.Net.Mail;
using System.Net;

namespace backend_app.Services
{
    public class EmailService
    {
        private readonly SmtpSettings _smtpSettings;

        public EmailService(IOptions<SmtpSettings> smtpSettings)
        {
            _smtpSettings = smtpSettings.Value;
        }

        public void SendVerifiedUserEmail(User user)
        {
            var adminEmail = _smtpSettings.Username;

            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines System");
            var toAddress = new MailAddress(adminEmail);

            string subject = "New User Registration";

            string body = $@"
            <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Exo:wght@400;600&display=swap' rel='stylesheet'>
                </head>

                <body style='margin:0; font-family: Exo, sans-serif; color:#000;'>

                    <h2 style='font-family: Orbitron, sans-serif; 
                               color:#2d4f8b; 
                               font-weight:700; 
                               margin-top:0; 
                               margin-bottom:20px; 
                               letter-spacing:0.6px;'>
                           New User Registration
                    </h2>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        A new user has registered:
                    </p>

                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>Full Name:</b> {user.FullName}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>Email:</b> {user.Email}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>Phone:</b> {user.Phone}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>Profession:</b> {user.Profession}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>Gender:</b> {user.Gender}
                    </p>

                </body>
            </html>";

            using var smtp = new SmtpClient
            {
                Host = _smtpSettings.Host,
                Port = _smtpSettings.Port,
                EnableSsl = _smtpSettings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };

            using var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            smtp.Send(message);
        }

        // VERIFY EMAIL
        public void SendVerificationEmail(User user)
        {
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(user.Email);

            string subject = "Verify Your Email";

            string verifyLink = $"http://localhost:3000/verify-email?token={user.VerificationToken}";

            string body = $@"
            <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Exo:wght@400;600&display=swap' rel='stylesheet'>
                </head>

                <body style='margin:0; padding:40px 25px; font-family: Exo, sans-serif; color:#000;'>

                    <h2 style='font-family: Orbitron, sans-serif; 
                               color:#2d4f8b; 
                               font-weight:700; 
                               margin-top:0; 
                               margin-bottom:20px; 
                               letter-spacing:0.6px;'>
                           Verify Your Email
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        Hi <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        Thank you for creating an account with <b>3D Machines</b>.<br/>
                        Please verify your email to activate your account.
                    </p>

                    <a href='{verifyLink}'
                       style='display:inline-block;
                              padding:10px 20px;
                              background:#345ea0;
                              color:white;
                              text-decoration:none;
                              font-size:14px;
                              font-weight:700;
                              border-radius:6px;
                              margin-top:5px;'>
                        Verify Email
                    </a>

                    <p style='font-size:13px; margin-top:28px; max-width:480px;'>
                        If you did not create this account, simply ignore this message.
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – The 3D Machines Team
                    </p>

                </body>
            </html>";

            using var smtp = new SmtpClient
            {
                Host = _smtpSettings.Host,
                Port = _smtpSettings.Port,
                EnableSsl = _smtpSettings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };

            using var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            smtp.Send(message);
        }

        // WELCOME EMAIL AFTER VERIFICATION
        public void SendWelcomeEmail(User user)
        {
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(user.Email, user.FullName);

            string subject = "Welcome to 3D Machines";

            string body = $@"
            <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Exo:wght@400;600&display=swap' rel='stylesheet'>
                </head>

                <body style='margin:0; padding:40px 25px; font-family: Exo, sans-serif; color:#000;'>

                    <h2 style='font-family: Orbitron, sans-serif; 
                               color:#2d4f8b; 
                               font-weight:700; 
                               margin-top:0; 
                               margin-bottom:20px; 
                               letter-spacing:0.6px;'>
                           Welcome to 3D Machines
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        Hi <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        Your email has been successfully verified and your account is now active.<br/>
                        You can log in and start using 3D Machines.
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        If you have any questions, just reply to this email.
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – The 3D Machines Team
                    </p>

                </body>
            </html>";

            using var smtp = new SmtpClient
            {
                Host = _smtpSettings.Host,
                Port = _smtpSettings.Port,
                EnableSsl = _smtpSettings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };

            using var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            smtp.Send(message);
        }

        // FORGOT PASSWORD EMAIL
        public void SendPasswordResetEmail(string userEmail, string token, string fullName)
        {
            fullName = (fullName ?? "").Trim();
            if (string.IsNullOrWhiteSpace(fullName))
                fullName = "there";

            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(userEmail);

            string subject = "Password Reset Request";

            string resetLink = $"http://localhost:3000/reset-password?token={token}";

            string body = $@"
            <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Exo:wght@400;600&display=swap' rel='stylesheet'>
                </head>

                <body style='margin:0; padding:40px 25px; font-family: Exo, sans-serif; color:#000;'>

                    <h2 style='font-family: Orbitron, sans-serif; 
                       color:#2d4f8b; 
                       font-weight:700; 
                       margin-top:0; 
                       margin-bottom:20px; 
                       letter-spacing:0.6px; 
                       text-align:left;'>
                            Password Reset Request
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        Hi <b>{fullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        We received a request to reset your 3D Machines account password.<br />
                        Click the button below to create a new password.
                    </p>

                    <a href='{resetLink}'
                       style='display:inline-block;
                              padding:10px 20px;
                              background:#345ea0;
                              color:white;
                              text-decoration:none;
                              font-size:14px;
                              font-weight:700;
                              border-radius:6px;
                              margin-top:5px;'>
                        Reset Password
                    </a>

                    <p style='font-size:13px; margin-top:28px; max-width:480px;'>
                        If you didn’t request this, you can safely ignore this email.<br />
                        Your password will remain unchanged.
                    </p>

                    <p style='margin-top:35px; color: #000 !important; font-size:13px;'>
                        – The 3D Machines Team
                    </p>
                </body>
            </html>";


            using var smtp = new SmtpClient
            {
                Host = _smtpSettings.Host,
                Port = _smtpSettings.Port,
                EnableSsl = _smtpSettings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };

            using var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            smtp.Send(message);
        }

    }
}