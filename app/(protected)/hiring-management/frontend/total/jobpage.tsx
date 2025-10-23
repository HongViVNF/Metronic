"use client";
import JobPage from "../job/JobPage";

export default function JobManagementPage() {
  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-10xl mx-auto p-6">
        {/* Main Content - Only Job List */}
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-sm border p-1">
            <JobPage />
          </div>
        </div>
      </div>
    </div>
  );
}