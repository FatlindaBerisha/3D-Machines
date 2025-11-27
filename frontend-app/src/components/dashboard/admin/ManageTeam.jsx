import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { MdSchool, MdEngineering, MdBrush, MdDelete } from "react-icons/md";
import Pagination from "../Pagination";
import api from "../../../utils/axiosClient"; // <-- IMPORTANT
import "../../styles/Profile.css";

function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export default function ManageTeam() {
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
        toast.error("Failed to fetch team members.");
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
        <p>Are you sure you want to delete this member?</p>
        <div className="btn-group">
          <button
            className="confirm-yes"
            onClick={() => {
              actuallyDelete(memberId);
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            Yes
          </button>
          <button
            className="confirm-no"
            onClick={() => {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            No
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

      toast.success("Member deleted successfully.");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Failed to delete team member";
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
      <h2 className="profile-title">Team Members</h2>

      {teamMembers.length === 0 ? (
        <p className="no-team-message">No team members found.</p>
      ) : (
        <>
          <table className="team-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Profession</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Delete</th>
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
                      aria-label="Delete member"
                      title="Delete member"
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