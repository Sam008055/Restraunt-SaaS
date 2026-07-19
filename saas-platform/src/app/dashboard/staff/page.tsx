"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  ShieldCheck,
  EnvelopeSimple,
  Trash,
  DotsThree,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "manager" | "staff";
  status: "active" | "invited";
  joinedAt?: string;
}

const DEMO_STAFF: StaffMember[] = [
  {
    id: "u-1",
    name: "Ravi Kumar",
    email: "ravi@thespicegarden.com",
    role: "manager",
    status: "active",
    joinedAt: "12 Oct 2025",
  },
  {
    id: "u-2",
    name: "Sneha Patel",
    email: "sneha.p@gmail.com",
    role: "staff",
    status: "active",
    joinedAt: "05 Nov 2025",
  },
  {
    id: "u-3",
    name: "Amit Singh",
    email: "amit.s@gmail.com",
    role: "staff",
    status: "invited",
  },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(DEMO_STAFF);
  const [inviteOpen, setInviteOpen] = useState(false);

  const removeStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0d1b2a] tracking-tight">Staff Management</h1>
          <p className="text-sm text-[#74777d] mt-1">
            Manage who has access to your restaurant dashboard and KDS.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 h-10 px-5 bg-[#0d1b2a] hover:bg-[#1b263b] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <UserPlus size={16} weight="bold" />
          Invite Staff
        </button>
      </div>

      <div className="px-8 pb-8 flex-1">
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f9f9ff] border-b border-[#e2e8f0]">
                <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#415a77] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3ff]">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-[#f9f9ff] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#e8edff] text-[#0d1b2a] flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0d1b2a]">{member.name}</p>
                        <p className="text-xs text-[#74777d]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        size={16}
                        className={member.role === "manager" ? "text-purple-600" : "text-[#74777d]"}
                        weight={member.role === "manager" ? "fill" : "regular"}
                      />
                      <span className="text-sm text-[#44474c] capitalize">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        member.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {member.status === "invited" && (
                        <button className="text-xs font-semibold text-[#10b981] hover:text-[#059669] transition px-3 py-1.5 rounded-lg border border-[#e2e8f0] hover:bg-emerald-50">
                          Resend Invite
                        </button>
                      )}
                      <button
                        onClick={() => removeStaff(member.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#74777d] hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
