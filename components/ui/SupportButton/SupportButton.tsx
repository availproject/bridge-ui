"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";

export function SupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Support"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2778E9] to-[#439FE7] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 focus:outline-none"
      >
        <MessageCircleQuestion className="h-4 w-4 shrink-0" />
        <span>Support</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-[#0d1117] border border-gray-700 text-white rounded-2xl px-8 py-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2778E9] to-[#439FE7]">
                <MessageCircleQuestion className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-white text-lg font-semibold">
                Need Help?
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-300 text-sm leading-relaxed pt-1">
              If you face any issue, create a ticket on{" "}
              <a
                href="https://discord.com/invite/AvailProject"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#439FE7] underline underline-offset-2 hover:text-white transition-colors"
              >
                Avail Discord
              </a>
              {" "}and our team will get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
