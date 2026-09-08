"use client";
import CustomPagination from "@/components/dashboard/CustomPagination";
import {
  CustomTable,
  CustomTableBody,
  CustomTableCell,
  CustomTableHead,
  CustomTableHeader,
  CustomTableRow,
} from "@/components/dashboard/DataTable";
import Loader from "@/components/dashboard/Loader";
import CustomSearchbar from "@/components/dashboard/Searchbar";
import axios from "axios";
import { useEffect, useState } from "react";

const ActivityLog = () => {
  const [activities, setActivities] = useState<
    {
      userName: string;
      email: string;
      timeStamp: string;
      activityType: string;
      description: string;
      status: number;
    }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL;
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/activity`);
        setActivities(response.data.data);
      } catch (err) {
        console.log("The ERROR: ", err);

        setError("Failed to fetch activities.");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [API_BASE_URL]);
  // Sort activities by timeStamp in descending order (latest first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
  );

  // Filter activities based on search query
  const filteredActivities = sortedActivities.filter((activity) =>
    ["userName", "email"].some((key) =>
      (activity[key as keyof typeof activity] as string)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
  );

  // const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  return (
    <div className="px-2 space-y-4  ">
      <h1 className="text-2xl font-bold">Activity Log ({activities.length})</h1>
      <CustomSearchbar
        onSearch={setSearchQuery}
        placeholder="Search by username,email ..."
      />
      {loading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow>
              <CustomTableHead>User Name</CustomTableHead>
              <CustomTableHead>Email</CustomTableHead>
              <CustomTableHead>Time Stamp</CustomTableHead>
              <CustomTableHead>Activity Type</CustomTableHead>
              <CustomTableHead>Description</CustomTableHead>
              <CustomTableHead>Status</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {currentActivities.map((activity, index) => (
              <CustomTableRow key={index}>
                <CustomTableCell>{activity.userName}</CustomTableCell>
                <CustomTableCell>{activity.email}</CustomTableCell>
                <CustomTableCell>
                  {new Date(activity.timeStamp).toLocaleString()}
                </CustomTableCell>
                <CustomTableCell>{activity.activityType}</CustomTableCell>
                <CustomTableCell>{activity.description}</CustomTableCell>

                <CustomTableCell
                  className={` font-semibold rounded-md text-center ${
                    activity.status === 200 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {activity.status}
                </CustomTableCell>
              </CustomTableRow>
            ))}
          </CustomTableBody>
        </CustomTable>
      )}
      {/* Pagination Component */}
      <div className="">
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ActivityLog;
