import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/frontend/components/ui/dialog";
import { Button } from "@/app/frontend/components/ui/button";
import { Input } from "@/app/frontend/components/ui/input";
import { Label } from "@/app/frontend/components/ui/label";

interface InterviewStatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  interviewStatus: "pass" | "fail" | "";
  setInterviewStatus: (status: "pass" | "fail" | "") => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  onSubmit: () => void;
}

export function InterviewStatusModal({
  isOpen,
  onOpenChange,
  interviewStatus,
  setInterviewStatus,
  rejectReason,
  setRejectReason,
  onSubmit,
}: InterviewStatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      onOpenChange(open);
      if (!open) {
        setInterviewStatus("");
        setRejectReason("");
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chọn trạng thái phỏng vấn</DialogTitle>
          <DialogDescription>
            Vui lòng chọn kết quả phỏng vấn cho ứng viên.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant={interviewStatus === "pass" ? "default" : "outline"}
              onClick={() => {
                setInterviewStatus("pass");
                setRejectReason("");
              }}
              className="flex-1"
            >
              Đậu
            </Button>
            <Button
              variant={interviewStatus === "fail" ? "default" : "outline"}
              onClick={() => setInterviewStatus("fail")}
              className="flex-1"
            >
              Rớt
            </Button>
          </div>
          {interviewStatus === "fail" && (
            <div className="grid gap-2">
              <Label htmlFor="rejectReason">Lý do rớt</Label>
              <Input
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do rớt phỏng vấn"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setInterviewStatus("");
              setRejectReason("");
            }}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!interviewStatus || (interviewStatus === "fail" && !rejectReason)}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}