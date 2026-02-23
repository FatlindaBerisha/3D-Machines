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

        public void SendVerifiedUserEmail(User user, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            var adminEmail = _smtpSettings.Username;

            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines System");
            var toAddress = new MailAddress(adminEmail);

            string subject = "New User Registration";
            string title = "New User Registration";
            string text = "A new user has registered:";
            string nameLabel = "Full Name";
            string emailLabel = "Email";
            string phoneLabel = "Phone";
            string profLabel = "Profession";
            string genderLabel = "Gender";

            if (language == "sq")
            {
                subject = "Regjistrim i Ri i Përdoruesit";
                title = "Regjistrim i Ri i Përdoruesit";
                text = "Një përdorues i ri është regjistruar:";
                nameLabel = "Emri i Plotë";
                emailLabel = "Email";
                phoneLabel = "Telefoni";
                profLabel = "Profesioni";
                genderLabel = "Gjinia";
            }
            else if (language == "de")
            {
                subject = "Neue Benutzerregistrierung";
                title = "Neue Benutzerregistrierung";
                text = "Ein neuer Benutzer hat sich registriert:";
                nameLabel = "Vollständiger Name";
                emailLabel = "E-Mail";
                phoneLabel = "Telefon";
                profLabel = "Beruf";
                genderLabel = "Geschlecht";
            }

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
                           {title}
                    </h2>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {text}
                    </p>

                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>{nameLabel}:</b> {user.FullName}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>{emailLabel}:</b> {user.Email}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>{phoneLabel}:</b> {user.Phone}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>{profLabel}:</b> {user.Profession}
                    </p>
                    <p style='font-size:14px; margin-bottom:4px;'>
                        <b>{genderLabel}:</b> {user.Gender}
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
        public void SendVerificationEmail(User user, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(user.Email);

            string subject = "Verify Your Email";
            string title = "Verify Your Email";
            string hi = "Hi";
            string thanks = "Thank you for creating an account with <b>3D Machines</b>.<br/>Please verify your email to activate your account.";
            string verifyBtn = "Verify Email";
            string ignore = "If you did not create this account, simply ignore this message.";
            string team = "The 3D Machines Team";

            if (language == "sq")
            {
                subject = "Verifikoni Email-in Tuaj";
                title = "Verifikoni Email-in Tuaj";
                hi = "Përshëndetje";
                thanks = "Faleminderit që keni krijuar një llogari në <b>3D Machines</b>.<br/>Ju lutemi verifikoni email-in tuaj për të aktivizuar llogarinë.";
                verifyBtn = "Verifiko Email-in";
                ignore = "Nëse nuk e keni krijuar këtë llogari, thjesht injoroni këtë mesazh.";
                team = "Ekipi i 3D Machines";
            }
            else if (language == "de")
            {
                subject = "Bestätigen Sie Ihre E-Mail";
                title = "Bestätigen Sie Ihre E-Mail";
                hi = "Hallo";
                thanks = "Vielen Dank für die Erstellung eines Kontos bei <b>3D Machines</b>.<br/>Bitte bestätigen Sie Ihre E-Mail, um Ihr Konto zu aktivieren.";
                verifyBtn = "E-Mail bestätigen";
                ignore = "Wenn Sie dieses Konto nicht erstellt haben, ignorieren Sie diese Nachricht einfach.";
                team = "Das 3D Machines Team";
            }

            string verifyLink = $"http://localhost:3000/verify-email?token={user.VerificationToken}&lng={language}";

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
                           {title}
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        {hi} <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {thanks}
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
                        {verifyBtn}
                    </a>

                    <p style='font-size:13px; margin-top:28px; max-width:480px;'>
                        {ignore}
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – {team}
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
        public void SendWelcomeEmail(User user, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(user.Email, user.FullName);

            string subject = "Welcome to 3D Machines";
            string title = "Welcome to 3D Machines";
            string hi = "Hi";
            string text1 = "Your email has been successfully verified and your account is now active.<br/>You can log in and start using 3D Machines.";
            string text2 = "If you have any questions, just reply to this email.";
            string team = "The 3D Machines Team";

            if (language == "sq")
            {
                subject = "Mirë se vini në 3D Machines";
                title = "Mirë se vini në 3D Machines";
                hi = "Përshëndetje";
                text1 = "Email-i juaj është verifikuar me sukses dhe llogaria juaj tani është aktive.<br/>Ju mund të hyni dhe të filloni të përdorni 3D Machines.";
                text2 = "Nëse keni ndonjë pyetje, thjesht përgjigjuni këtij emaili.";
                team = "Ekipi i 3D Machines";
            }
            else if (language == "de")
            {
                subject = "Willkommen bei 3D Machines";
                title = "Willkommen bei 3D Machines";
                hi = "Hallo";
                text1 = "Ihre E-Mail wurde erfolgreich verifiziert und Ihr Konto ist nun aktiv.<br/>Sie können sich anmelden und 3D Machines nutzen.";
                text2 = "Wenn Sie Fragen haben, antworten Sie einfach auf diese E-Mail.";
                team = "Das 3D Machines Team";
            }

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
                           {title}
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        {hi} <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {text1}
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {text2}
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – {team}
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
        public void SendPasswordResetEmail(string userEmail, string token, string fullName, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            fullName = (fullName ?? "").Trim();
            if (string.IsNullOrWhiteSpace(fullName))
                fullName = "there";

            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(userEmail);

            string subject = "Password Reset Request";
            string title = "Password Reset Request";
            string hi = "Hi";
            string text = "We received a request to reset your 3D Machines account password.<br />Click the button below to create a new password.";
            string resetBtn = "Reset Password";
            string ignore = "If you didn’t request this, you can safely ignore this email.<br />Your password will remain unchanged.";
            string team = "The 3D Machines Team";

            if (language == "sq")
            {
                subject = "Kërkesë për Rivendosjen e Fjalëkalimit";
                title = "Kërkesë për Rivendosjen e Fjalëkalimit";
                hi = "Përshëndetje";
                text = "Kemi marrë një kërkesë për të rivendosur fjalëkalimin e llogarisë suaj në 3D Machines.<br />Klikoni butonin e mëposhtëm për të krijuar një fjalëkalim të ri.";
                resetBtn = "Rivendos Fjalëkalimin";
                ignore = "Nëse nuk e keni kërkuar këtë, mund ta shpërfillni me siguri këtë email.<br />Fjalëkalimi juaj do të mbetet i pandryshuar.";
                team = "Ekipi i 3D Machines";
            }
            else if (language == "de")
            {
                subject = "Passwort-Zurücksetzungsanfrage";
                title = "Passwort-Zurücksetzungsanfrage";
                hi = "Hallo";
                text = "Wir haben eine Anfrage zum Zurücksetzen Ihres 3D Machines-Kontopassworts erhalten.<br />Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu erstellen.";
                resetBtn = "Passwort zurücksetzen";
                ignore = "Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.<br />Ihr Passwort bleibt unverändert.";
                team = "Das 3D Machines Team";
            }

            string resetLink = $"http://localhost:3000/reset-password?token={token}&lng={language}";

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
                            {title}
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        {hi} <b>{fullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {text}
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
                        {resetBtn}
                    </a>

                    <p style='font-size:13px; margin-top:28px; max-width:480px;'>
                        {ignore}
                    </p>

                    <p style='margin-top:35px; color: #000 !important; font-size:13px;'>
                        – {team}
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

        // SUSPICIOUS LOGIN ACTIVITY EMAIL
        public void SendSuspiciousLoginEmail(User user, int lockoutMinutes, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Security");
            var toAddress = new MailAddress(user.Email, user.FullName);

            string subject = "Security Alert - Suspicious Login Activity Detected";
            string title = "Security Alert";
            string hi = "Hi";
            string detected = $"We detected <b>multiple failed login attempts</b> on your 3D Machines account.<br/>Your account has been temporarily locked for <b>{lockoutMinutes} minutes</b> for security.";
            string ifYou = "<b>If this was you:</b> Wait for the lockout to expire and try again with the correct password.";
            string ifNotYou = "<b>If this wasn't you:</b> Someone may be trying to access your account. We recommend changing your password immediately after the lockout expires.";
            string incidentTime = "Time of incident";
            string team = "The 3D Machines Security Team";

            if (language == "sq")
            {
                subject = "Alarm Sigurie - U diktua aktivitet i dyshimtë hyrjeje";
                title = "Alarm Sigurie";
                hi = "Përshëndetje";
                detected = $"Kemi diktuar <b>shumë përpjekje të dështuara për hyrje</b> në llogarinë tuaj në 3D Machines.<br/>Llogaria juaj është bllokuar përkohësisht për <b>{lockoutMinutes} minuta</b> për siguri.";
                ifYou = "<b>Nëse ishit ju:</b> Prisni derisa të përfundojë bllokimi dhe provoni përsëri me fjalëkalimin e saktë.";
                ifNotYou = "<b>Nëse nuk ishit ju:</b> Dikush mund të jetë duke u përpjekur të aksesojë llogarinë tuaj. Ne rekomandojmë të ndryshoni fjalëkalimin tuaj menjëherë pasi të përfundojë bllokimi.";
                incidentTime = "Koha e incidentit";
                team = "Ekipi i Sigurisë së 3D Machines";
            }
            else if (language == "de")
            {
                subject = "Sicherheitswarnung - Verdächtige Anmeldeaktivität erkannt";
                title = "Sicherheitswarnung";
                hi = "Hallo";
                detected = $"Wir haben <b>mehrere fehlgeschlagene Anmeldeversuche</b> in Ihrem 3D Machines-Konto festgestellt.<br/>Ihr Konto wurde aus Sicherheitsgründen vorübergehend für <b>{lockoutMinutes} Minuten</b> gesperrt.";
                ifYou = "<b>Wenn Sie das waren:</b> Warten Sie, bis die Sperre abläuft, und versuchen Sie es erneut mit dem richtigen Passwort.";
                ifNotYou = "<b>Wenn Sie das nicht waren:</b> Jemand versucht möglicherweise, auf Ihr Konto zuzugreifen. Wir empfehlen, Ihr Passwort sofort zu ändern, nachdem die Sperre abgelaufen ist.";
                incidentTime = "Zeitpunkt des Vorfalls";
                team = "Das 3D Machines Sicherheitsteam";
            }

            var cetZone = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
            var cetTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cetZone);

            string body = $@"
            <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Exo:wght@400;600&display=swap' rel='stylesheet'>
                </head>

                <body style='margin:0; padding:40px 25px; font-family: Exo, sans-serif; color:#000;'>

                    <h2 style='font-family: Orbitron, sans-serif; 
                               color:#c0392b; 
                               font-weight:700; 
                               margin-top:0; 
                               margin-bottom:20px; 
                               letter-spacing:0.6px;'>
                           {title}
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        {hi} <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {detected}
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px; background:#fee2e2; padding:15px; border-radius:6px; border-left:4px solid #dc2626; color: #7f1d1d;'>
                        {ifYou}<br/><br/>
                        {ifNotYou}
                    </p>

                    <p style='font-size:13px; margin-top:28px; max-width:480px; color:#666;'>
                        {incidentTime}: {cetTime:dd.MM.yyyy HH:mm:ss} (CET)
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – {team}
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

        // EMAIL CHANGE VERIFICATION (sent to NEW email)
        public void SendEmailChangeVerification(User user, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Support");
            var toAddress = new MailAddress(user.PendingEmail);

            string subject = "Verify Your New Email Address";
            string title = "Verify Your New Email";
            string hi = "Hi";
            string text = "You requested to change your email address for your <b>3D Machines</b> account.<br/>Please click the button below to verify this new email address.";
            string verifyBtn = "Verify New Email";
            string ignore = "If you did not request this change, you can safely ignore this email.<br/>This link will expire in 24 hours.";
            string team = "The 3D Machines Team";

            if (language == "sq")
            {
                subject = "Verifikoni Adresën Tuaj të Re të Email-it";
                title = "Verifikoni Email-in tuaj të ri";
                hi = "Përshëndetje";
                text = "Ju keni kërkuar të ndryshoni adresën tuaj të email-it për llogarinë tuaj në <b>3D Machines</b>.<br/>Ju lutemi klikoni butonin e mëposhtëm për të verifikuar këtë adresë të re email-i.";
                verifyBtn = "Verifiko Email-in e ri";
                ignore = "Nëse nuk e keni kërkuar këtë ndryshim, thjesht injoroni këtë email.<br/>Kjo lidhje do të skadojë në 24 orë.";
                team = "Ekipi i 3D Machines";
            }
            else if (language == "de")
            {
                subject = "Bestätigen Sie Ihre neue E-Mail-Adresse";
                title = "Neue E-Mail bestätigen";
                hi = "Hallo";
                text = "Sie haben beantragt, Ihre E-Mail-Adresse für Ihr <b>3D Machines</b>-Konto zu ändern.<br/>Bitte klicken Sie auf die Schaltfläche unten, um diese neue E-Mail-Adresse zu bestätigen.";
                verifyBtn = "Neue E-Mail bestätigen";
                ignore = "Wenn Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.<br/>Dieser Link läuft in 24 Stunden ab.";
                team = "Das 3D Machines Team";
            }

            string verifyLink = $"http://localhost:3000/confirm-email-change?token={user.EmailChangeToken}&lng={language}";

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
                           {title}
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        {hi} <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {text}
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
                        {verifyBtn}
                    </a>

                    <p style='font-size:13px; margin-top:28px; max-width:480px;'>
                        {ignore}
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – {team}
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

        // EMAIL CHANGE NOTIFICATION (sent to OLD email)
        public void SendEmailChangeNotification(User user, string language = "en")
        {
            language = language?.ToLower() ?? "en";
            var fromAddress = new MailAddress(_smtpSettings.Username, "3D Machines Security");
            var toAddress = new MailAddress(user.Email, user.FullName);

            string subject = "Email Change Request - Security Notice";
            string title = "Email Change Request";
            string hi = "Hi";
            string requested = $"A request has been made to change the email address associated with your <b>3D Machines</b> account.<br/>The new email address is: <span style='color:#3f51b5; font-weight:700; text-decoration:none;'>{user.PendingEmail}</span>";
            string ifYou = "<b>If this was you:</b> No action is needed. Simply verify the new email address using the link we sent.";
            string ifNotYou = "<b>If this wasn't you:</b> Your account may be compromised. Please log in immediately and change your password.";
            string requestTime = "Time of request";
            string team = "The 3D Machines Security Team";

            if (language == "sq")
            {
                subject = "Kërkesë për Ndryshimin e Email-it - Njoftim Sigurie";
                title = "Kërkesë për Ndryshimin e Email-it";
                hi = "Përshëndetje";
                requested = $"Është bërë një kërkesë për të ndryshuar adresën e email-it të lidhur me llogarinë tuaj në <b>3D Machines</b>.<br/>Adresa e re e email-it është: <span style='color:#3f51b5; font-weight:700; text-decoration:none;'>{user.PendingEmail}</span>";
                ifYou = "<b>Nëse ishit ju:</b> Nuk kërkohet asnjë veprim. Thjesht verifikoni adresën e re të email-it duke përdorur lidhjen që dërguam.";
                ifNotYou = "<b>Nëse nuk ishit ju:</b> Llogaria juaj mund të jetë komprometuar. Ju lutemi hyni menjëherë dhe ndryshoni fjalëkalimin tuaj.";
                requestTime = "Koha e kërkesës";
                team = "Ekipi i Sigurisë së 3D Machines";
            }
            else if (language == "de")
            {
                subject = "Anfrage zur E-Mail-Änderung - Sicherheitshinweis";
                title = "Anfrage zur E-Mail-Änderung";
                hi = "Hallo";
                requested = $"Es wurde eine Anfrage gestellt, die mit Ihrem <b>3D Machines</b>-Konto verknüpfte E-Mail-Adresse zu ändern.<br/>Die neue E-Mail-Adresse lautet: <span style='color:#3f51b5; font-weight:700; text-decoration:none;'>{user.PendingEmail}</span>";
                ifYou = "<b>Wenn Sie das waren:</b> Es ist keine Aktion erforderlich. Bestätigen Sie einfach die neue E-Mail-Adresse über den von uns gesendeten Link.";
                ifNotYou = "<b>Wenn Sie das nicht waren:</b> Ihr Konto ist möglicherweise kompromittiert. Bitte melden Sie sich sofort an und ändern Sie Ihr Passwort.";
                requestTime = "Zeitpunkt der Anfrage";
                team = "Das 3D Machines Sicherheitsteam";
            }

            var cetZone = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
            var cetTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cetZone);

            string body = $@"
            <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Exo:wght@400;600&display=swap' rel='stylesheet'>
                </head>

                <body style='margin:0; padding:40px 25px; font-family: Exo, sans-serif; color:#000;'>

                    <h2 style='font-family: Orbitron, sans-serif; 
                               color:#c0392b; 
                               font-weight:700; 
                               margin-top:0; 
                               margin-bottom:20px; 
                               letter-spacing:0.6px;'>
                           {title}
                    </h2>

                    <p style='font-size:15px; margin-bottom:8px;'>
                        {hi} <b>{user.FullName}</b>,
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px;'>
                        {requested}
                    </p>

                    <p style='font-size:14px; margin-bottom:22px; max-width:480px; background:#fee2e2; padding:15px; border-radius:6px; border-left:4px solid #dc2626; color: #7f1d1d;'>
                        {ifYou}<br/><br/>
                        {ifNotYou}
                    </p>

                    <p style='font-size:13px; margin-top:28px; max-width:480px; color:#666;'>
                        {requestTime}: {cetTime:dd.MM.yyyy HH:mm:ss} (CET)
                    </p>

                    <p style='margin-top:35px; color:#000 !important; font-size:13px;'>
                        – {team}
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