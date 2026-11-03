"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/Button";

/** Opens the browser's print dialog. Used on /about and on the /pitch deck. */
export function PrintButton() {
  return (
    <Button
      onClick={(e) => {
        // Drop focus so Space/Enter go back to the page (the deck uses Space for "next").
        e.currentTarget.blur();
        window.print();
      }}
      icon={<Printer aria-hidden className="h-4 w-4" />}
      className="print:hidden"
    >
      Print
    </Button>
  );
}
