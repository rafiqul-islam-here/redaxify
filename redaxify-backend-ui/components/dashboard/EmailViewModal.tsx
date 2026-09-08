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
import { Eye } from "lucide-react";

interface EmailViewModalProps {
  message: string;
}

const EmailViewModal: React.FC<EmailViewModalProps> = ({ message }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <Eye className="w-5 h-5 text-blue-500 hover:text-blue-700  " />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Feedback Message</DialogTitle>
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="ghost"
              data-testid="dialog-close"
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailViewModal;
