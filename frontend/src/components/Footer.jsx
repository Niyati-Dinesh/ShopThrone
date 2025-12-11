"use client";

import { Mail, Crown } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api"; // Import your axios instance if you have one

export default function Footer() {
  const [showEmail, setShowEmail] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const handleSendEmail = async () => {
    if (!feedbackEmail.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSendingFeedback(true);
    try {
      // Option 1: Using fetch directly
      const response = await fetch(
        "http://localhost:5555/api/send-feedback-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: feedbackEmail,
            userEmail: localStorage.getItem("user")
              ? JSON.parse(localStorage.getItem("user")).email
              : "anonymous",
            name: localStorage.getItem("user")
              ? JSON.parse(localStorage.getItem("user")).name
              : "anonymous",
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Message sent successfully!");
        setFeedbackEmail("");
        setShowEmail(false);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message. Please try again.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Crown
              size={24}
              className="text-[var(--accent-primary)]"
              strokeWidth={1.2}
            />
            <span className="font-serif text-xl text-[var(--text-primary)] font-light">
              ShopThrone
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <button
              onClick={() => setShowEmail(!showEmail)}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-dark)] transition-colors font-light"
            >
              <Mail size={18} />
              Contact Me
            </button>

            <p className="text-sm text-[var(--text-secondary)] font-light">
              © {currentYear} ShopThrone. All rights reserved.
            </p>
          </div>
        </div>

        {/* Contact Email Form */}
        {showEmail && (
          <div className="mt-8 p-6 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg text-[var(--text-primary)] font-light">
                Send me a message
              </h3>
              <button
                onClick={() => setShowEmail(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <textarea
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 rounded-lg focus:outline-none resize-none h-24 border border-[var(--border-color)] focus:border-[var(--accent-primary)]"
                rows={4}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setFeedbackEmail("");
                    setShowEmail(false);
                  }}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-light"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!feedbackEmail.trim() || sendingFeedback}
                  className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
                >
                  {sendingFeedback ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
