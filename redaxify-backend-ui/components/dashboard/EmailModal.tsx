"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Mail } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface EmailModalProps {
  recipientEmail: string;
  id: number;
  onEmailSend?: (id: number) => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
  recipientEmail,
  id,
  onEmailSend,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle send email funcion
  const handleSendEmail = async () => {
    // Basic validation
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    try {
      setIsLoading(true);

      await axios.patch(
        `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/feedback/${id}`,
        {
          replyMessage: message,
          replySubject: subject,
        }
      );

      toast.success("Email sent successfully!"); // Success notification
      setSubject("");
      setMessage("");
      onEmailSend?.(id); // Notify parent component to update the  status (Pending to Replied)

      // Close the dialog
      document
        .querySelector('[data-testid="dialog-close"]')
        ?.dispatchEvent(new Event("click"));
    } catch (error) {
      console.error("Email sending error:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }

    // console.log("Email sent to:", recipientEmail);
    // console.log("Id:", id);
    // console.log("Subject:", subject);
    // console.log("Message:", message);
    // toast.success("Email sent successfully!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <Mail className="w-5 h-5 text-gray-600 hover:text-blue-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Send Email to Contact</DialogTitle>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Recipient Email</label>
            <Input value={recipientEmail} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="h-28"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleSendEmail}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
          <DialogClose asChild>
            <Button
              variant="ghost"
              data-testid="dialog-close"
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
