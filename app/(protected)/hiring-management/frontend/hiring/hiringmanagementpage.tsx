"use client";
import { useState } from "react";
import { Users, Calendar, FileText, ClipboardList, CheckCircle, ListChecks, Briefcase } from "lucide-react";
import InterviewPage from "../interview/interview";
import HiringPipelineTable from "../pipeline/pipeline";
import EmailTemplates from "../emailtemplate/page";

import ActivitiesPage from "../activites/page";
import ChecklistPage from "../checklist/page";
import CandidateManagerment from "../candidate/CandidateManagerment";
import JobPage from "../job/JobPage";


export default function HiringManagementPage() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [activeInterviewTab, setActiveInterviewTab] = useState("interview");
  const [activeTemplateTab, setActiveTemplateTab] = useState("email");

  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-10xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Quản lý tuyển dụng
          </h1>
          <p className="text-gray-600">
            Quản lý ứng viên, phỏng vấn, đề thi, template và hoạt động
          </p>
        </div>

        {/* Tabs */}
        <div className="w-full">
          {/* Tab Navigation */}
          <div className="grid w-full grid-cols-7 mb-8 bg-white shadow-sm border rounded-lg overflow-hidden">
            {/* Quản lý job */}
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "jobs"
                ? "bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Briefcase size={18} />
              Quản lý Job
            </button>

            {/* Quản lý ứng viên */}
            <button
              onClick={() => setActiveTab("candidates")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "candidates"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Users size={18} />
              Quản lý ứng viên
            </button>

            {/* Quản lý phỏng vấn */}
            <button
              onClick={() => setActiveTab("interviews")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "interviews"
                ? "bg-green-50 text-green-700 border-b-2 border-green-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Calendar size={18} />
              Quản lý phỏng vấn
            </button>

            {/* Quản lý Template */}
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "templates"
                ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FileText size={18} />
              Quản lý Template
            </button>

            {/* Quản lý Pipeline */}
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "kanban"
                ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ClipboardList size={18} />
              Quản lý Pipeline
            </button>

            {/* Quản lý Checklist */}
            <button
              onClick={() => setActiveTab("checklist")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "checklist"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ListChecks size={18} />
              Checklist
            </button>

            {/* Quản lý Hoạt động */}
            <button
              onClick={() => setActiveTab("activities")}
              className={`flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all duration-200 ${activeTab === "activities"
                ? "bg-teal-50 text-teal-700 border-b-2 border-teal-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <CheckCircle size={18} />
              Quản lý Hoạt động
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "candidates" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-sm border p-1">
                <CandidateManagerment />
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-sm border p-1">
                <JobPage />
              </div>
            </div>
          )}

          {activeTab === "interviews" && (
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
          )}

          {activeTab === "templates" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Sub-tabs for Template */}
              <div className="flex border-b bg-gray-50 rounded-t-lg">
                <button
                  onClick={() => setActiveTemplateTab("email")}
                  className={`px-6 py-3 text-sm font-medium transition ${activeTemplateTab === "email"
                    ? "border-b-2 border-purple-500 text-purple-700 bg-white"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setActiveTemplateTab("contract")}
                  className={`px-6 py-3 text-sm font-medium transition ${activeTemplateTab === "contract"
                    ? "border-b-2 border-purple-500 text-purple-700 bg-white"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Hợp đồng
                </button>
              </div>

              {/* Sub-tab Content */}
              <div className="bg-white rounded-lg shadow-sm border p-1">
                {activeTemplateTab === "email" && <EmailTemplates />}
                {activeTemplateTab === "contract" && (
                  <div className="p-6 text-gray-600">
                    Quản lý Template Hợp đồng (đang phát triển)
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "kanban" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-sm border p-1">
                <HiringPipelineTable />
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-sm border p-1">
                <ChecklistPage />
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-sm border p-1">
                <ActivitiesPage />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}