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

        public void SendRegistrationEmail(User user)
        {
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines");
            var toAddress = new MailAddress(_smtpSettings.Username);

            const string subject = "New User Registration";
            string body = $"A new user has registered:\n\n" +
                          $"Full Name: {user.FullName}\n" +
                          $"Email: {user.Email}\n" +
                          $"Phone: {user.Phone}\n" +
                          $"Profession: {user.Profession}\n" +
                          $"Gender: {user.Gender}";

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
                Body = body
            };

            smtp.Send(message);
        }
    }
}