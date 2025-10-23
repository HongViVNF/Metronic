"use client";
import { useState } from "react";
import { Users, Calendar, FileText, ClipboardList, CheckCircle, ListChecks, Briefcase } from "lucide-react";
import InterviewPage from "../interview/interview";

import HiringPipelineTable from "../pipeline/pipeline";
import EmailTemplates from "../emailtemplate/page";



export default function InterviewManagementPage() {
  const [activeTab, setActiveTab] = useState("interviews");
  const [activeInterviewTab, setActiveInterviewTab] = useState("interview");

  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-10xl mx-auto p-6">
        {/* Main Content - Only Interviews Tab */}
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub-tabs */}
          <div className="flex border-b bg-gray-50 rounded-t-lg">
            <button
              onClick={() => setActiveInterviewTab("interview")}
              className={`px-6 py-3 text-sm font-medium transition ${activeInterviewTab === "interview"
                ? "border-b-2 border-green-500 text-green-700 bg-white"
                : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quản lý phỏng vấn
            </button>
            <button
              onClick={() => setActiveInterviewTab("examManagement")}
              className={`px-6 py-3 text-sm font-medium transition ${activeInterviewTab === "examManagement"
                ? "border-b-2 border-green-500 text-green-700 bg-white"
                : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quản lý kết quả bài thi phỏng vấn
            </button>
            <button
              onClick={() => setActiveInterviewTab("exams")}
              className={`px-6 py-3 text-sm font-medium transition ${activeInterviewTab === "exams"
                ? "border-b-2 border-green-500 text-green-700 bg-white"
                : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quản lý đề thi
            </button>
          </div>

          {/* Sub-tab Content */}
          <div className="bg-white rounded-lg shadow-sm border p-1">
            {activeInterviewTab === "interview" && <InterviewPage />}
            {/* {activeInterviewTab === "examManagement" && <QuanLyBaiThi />}
            {activeInterviewTab === "exams" && (
              <ManagePage />
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}