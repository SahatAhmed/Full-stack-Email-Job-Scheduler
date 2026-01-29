"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
        logout();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="mt-auto p-6">
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}