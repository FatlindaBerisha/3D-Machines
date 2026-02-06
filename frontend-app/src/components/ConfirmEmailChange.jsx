import { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosClient";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import { useTranslation } from "react-i18next";

export default function ConfirmEmailChange() {
    const { t } = useTranslation();
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("Processing your email change, please wait...");

    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);
    const token = params.get("token");
    const lng = params.get("lng");

    const { i18n } = useTranslation();

    useEffect(() => {
        if (lng && i18n.language !== lng) {
            i18n.changeLanguage(lng);
        }
    }, [lng, i18n]);

    useEffect(() => {
        async function confirmChange() {
            try {
                const res = await api.post("/auth/confirm-email-change", { token });
                const data = res?.data;
                const msg = data?.message || "Email changed successfully!";

                // Update tokens in localStorage
                if (data?.token) {
                    localStorage.setItem("token", data.token);
                }
                if (data?.refreshToken) {
                    localStorage.setItem("refreshToken", data.refreshToken);
                }

                // Update user context with new email
                setUser(prev => ({
                    ...prev,
                    email: data.email,
                    role: data.role,
                    fullName: data.fullName
                }));

                setStatus("success");
                setMessage(msg);
                toast.success(msg);

                // Redirect to appropriate dashboard with hard reload to ensure clean state
                setTimeout(() => {
                    const role = data?.role || localStorage.getItem("role") || "user";
                    if (role === "admin") {
                        window.location.href = "/dashboard/admin/profile";
                    } else {
                        window.location.href = "/dashboard/user/profile";
                    }
                }, 2000);
            } catch (err) {
                const backendMsg = err?.response?.data;
                const finalMsg =
                    typeof backendMsg === "string"
                        ? backendMsg
                        : backendMsg?.message || "Invalid or expired email change link.";

                setStatus("error");
                setMessage(finalMsg);
                toast.error(finalMsg);
            }
        }

        if (token) {
            confirmChange();
        } else {
            setStatus("error");
            setMessage("Email change link is missing a token.");
        }
    }, [token, navigate, setUser]);

    return (
        <div className="forgot-wrapper">
            <form className="forgot-form" onSubmit={(e) => e.preventDefault()}>
                <h2 className="forgot-title">Confirm Email Change</h2>

                {status === "processing" && (
                    <p className="forgot-description">{message}</p>
                )}

                {status === "success" && (
                    <>
                        <p className="forgot-description">{message}</p>
                        <p className="forgot-description" style={{ marginTop: "10px" }}>
                            Redirecting you to your profile...
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <p className="forgot-description" style={{ color: "#e63946" }}>
                            {message}
                        </p>
                        <button
                            type="button"
                            className="forgot-btn"
                            onClick={() => navigate("/")}
                            style={{ marginTop: "16px" }}
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
