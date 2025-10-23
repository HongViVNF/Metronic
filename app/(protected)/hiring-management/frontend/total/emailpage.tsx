"use client";
import EmailTemplates from "../emailtemplate/page";
import { useState } from "react";

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState("email");
  const [activeTemplateTab, setActiveTemplateTab] = useState("email");
  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-10xl mx-auto p-6">
        {/* Main Content - Only Email Templates */}
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub-tabs for Template */}
          <div className="flex border-b bg-gray-50 rounded-t-lg">
            <button
              onClick={() => setActiveTemplateTab("email")}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTemplateTab === "email"
                  ? "border-b-2 border-purple-500 text-purple-700 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setActiveTemplateTab("contract")}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTemplateTab === "contract"
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
      </div>
    </div>
  );
}
