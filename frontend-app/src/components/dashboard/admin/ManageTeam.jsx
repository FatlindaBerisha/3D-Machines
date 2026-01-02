import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { MdSchool, MdEngineering, MdBrush, MdDelete } from "react-icons/md";
import Pagination from "../Pagination";
import api from "../../../utils/axiosClient";
import "../../styles/Profile.css";

function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export default function ManageTeam() {
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState([]);
  const toastIdRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const professionIcons = {
    student: <MdSchool style={{ color: "#3f51b5" }} />,
    engineer: <MdEngineering style={{ color: "#3f51b5" }} />,
    designer: <MdBrush style={{ color: "#3f51b5" }} />,
  };

  // ---------------------------
  // FETCH TEAM MEMBERS
  // ---------------------------
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const res = await api.get("/team");
        setTeamMembers(res.data);
      } catch (error) {
        toast.error(t('toasts.fetchFailed'));
      }
    }

    fetchTeamMembers();
  }, []);

  // ---------------------------
  // DELETE CONFIRMATION
  // ---------------------------
  function showDeleteConfirm(memberId) {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    toastIdRef.current = toast.info(
      <div className="toast-confirmation">
        <p>{t('team.deleteConfirm')}</p>
        <div className="btn-group">
          <button
            className="confirm-yes"
            onClick={() => {
              actuallyDelete(memberId);
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            {t('team.yes')}
          </button>
          <button
            className="confirm-no"
            onClick={() => {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            {t('team.no')}
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        icon: true,
        className: "toast-info-box",
      }
    );
  }

  // ---------------------------
  // DELETE MEMBER
  // ---------------------------
  async function actuallyDelete(memberId) {
    try {
      await api.delete(`/team/${memberId}`);

      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));

      toast.success(t('toasts.deleteSuccess'));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        t('toasts.deleteFailed');
      toast.error(msg);
    }
  }

  // ---------------------------
  // PAGINATION
  // ---------------------------
  const totalPages = Math.ceil(teamMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = teamMembers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="team-container">
      <h2 className="profile-title">{t('team.title')}</h2>

      {teamMembers.length === 0 ? (
        <p className="no-team-message">{t('team.noMembers')}</p>
      ) : (
        <>
          <table className="team-table">
            <thead>
              <tr>
                <th>{t('team.fullName')}</th>
                <th>{t('team.email')}</th>
                <th>{t('team.profession')}</th>
                <th>{t('team.phone')}</th>
                <th>{t('team.gender')}</th>
                <th>{t('team.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {currentMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.fullName}</td>
                  <td>{member.email}</td>
                  <td>
                    <div className="profession-cell">
                      {professionIcons[member.profession?.toLowerCase()] || null}
                      {capitalizeFirstLetter(member.profession) || "-"}
                    </div>
                  </td>
                  <td>{member.phone || "-"}</td>
                  <td>{capitalizeFirstLetter(member.gender) || "-"}</td>
                  <td>
                    <button
                      onClick={() => showDeleteConfirm(member.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.3rem",
                      }}
                      aria-label={t('team.deleteMember')}
                      title={t('team.deleteMember')}
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}