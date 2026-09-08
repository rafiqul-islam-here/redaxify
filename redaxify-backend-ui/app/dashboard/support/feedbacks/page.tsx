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
import EmailModal from "@/components/dashboard/EmailModal";
import EmailViewModal from "@/components/dashboard/EmailViewModal";
import Loader from "@/components/dashboard/Loader";
// import MessageModal from "@/components/dashboard/MessageModal"; // Import the new MessageModal component
import CustomSearchbar from "@/components/dashboard/Searchbar";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";

const FeedbackPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [feedbacks, setFeedBacks] = useState<Feedback[]>([]);
  // Filter Feedback based on search query
  const filteredFeedbacks = feedbacks
    .filter((feedback) =>
      (["email", "firstName"] as Array<keyof Feedback>).some((key) =>
        feedback[key]?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Pagination Logic
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    // Fetch users from the API when the component mounts
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/feedback`
        );
        console.log("Feedbacks:", response.data);
        setFeedBacks(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  interface Feedback {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    number: string;
    message: string;
    replyStatus: "REPLIED" | "PENDING";
    createdAt: string;
  }
  // Handle delete feedback
  const handleDelete = (id: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span>Are you sure you want to delete this feedback?</span>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-sm bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                axios
                  .delete(
                    `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/feedback/${id}`
                  )
                  .then(() => {
                    setFeedBacks((prevFeedbacks) =>
                      prevFeedbacks.filter(
                        (feedback: Feedback) => feedback.id !== id
                      )
                    );
                    toast.success("Feedback deleted successfully!");
                  });
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000, // enough time to respond
      }
    );
  };

  return (
    <div className="px-2 space-y-8">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold">Feedbacks</h1>
      <CustomSearchbar
        onSearch={setSearchQuery}
        placeholder="Search by firstname, email"
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <CustomTable>
          <CustomTableHeader>
            <CustomTableHead>Name</CustomTableHead>
            <CustomTableHead>Email</CustomTableHead>
            <CustomTableHead>Phone</CustomTableHead>
            <CustomTableHead>Message</CustomTableHead>
            <CustomTableHead>Status</CustomTableHead>
            <CustomTableHead>CreatedAt</CustomTableHead>
            <CustomTableHead>Action</CustomTableHead>
          </CustomTableHeader>
          <CustomTableBody>
            {paginatedFeedbacks.map((feedback) => (
              <CustomTableRow key={feedback.id}>
                <CustomTableCell>
                  {feedback.firstName + feedback.lastName}
                </CustomTableCell>
                <CustomTableCell>{feedback.email}</CustomTableCell>
                <CustomTableCell>+{feedback.number}</CustomTableCell>
                <CustomTableCell>
                  <EmailViewModal message={feedback.message} />
                </CustomTableCell>
                <CustomTableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feedback.replyStatus === "REPLIED"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {feedback.replyStatus === "REPLIED" ? "REPLIED" : "PENDING"}
                  </span>
                </CustomTableCell>
                <CustomTableCell>
                  {new Date(feedback.createdAt).toLocaleString()}
                </CustomTableCell>
                <CustomTableCell>
                  <div className="flex space-x-2 justify-center">
                    <EmailModal
                      recipientEmail={feedback.email}
                      id={Number(feedback.id)}
                      onEmailSend={(id) => {
                        setFeedBacks((prev) => {
                          const updated = prev.map((fb) =>
                            fb.id.toString() === id.toString()
                              ? { ...fb, replyStatus: "REPLIED" as const }
                              : fb
                          );
                          return updated;
                        });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(feedback.id)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                    </Button>
                  </div>
                </CustomTableCell>
              </CustomTableRow>
            ))}
          </CustomTableBody>
        </CustomTable>
      )}
      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default FeedbackPage;
