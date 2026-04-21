import { Mic, MicOff, Phone, Video } from "lucide-react";
import type { Locale } from "../../i18n/utils";

/* ------------------------------------------------------------------ */
/*  Shared data (reuses same images as MeetingPreview)                 */
/* ------------------------------------------------------------------ */

const participants = {
  sarah: {
    name: "Sarah Chen",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop&crop=face",
  },
  alex: {
    name: "Alex Rivera",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face",
  },
  jordan: {
    name: "Jordan Lee",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop&crop=face",
  },
  marcus: {
    name: "Marcus Webb",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face",
  },
  self: {
    name: "You",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=200&fit=crop&crop=face",
  },
};

/* ------------------------------------------------------------------ */
/*  iPhone meeting – Speaker view                                      */
/* ------------------------------------------------------------------ */

export function IPhoneMeetingPreview({ lang: _lang }: { lang: Locale }) {
  return (
    <div
      aria-hidden="true"
      className="flex size-full select-none flex-col bg-[#111127]"
    >
      {/* Status bar spacer */}
      <div className="h-12 shrink-0" />

      {/* Main speaker */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={participants.sarah.image}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
          <span className="text-[10px] font-medium text-white/90">
            {participants.sarah.name}
          </span>
        </div>

        {/* Self PiP */}
        <div className="absolute end-2 top-2 w-[30%] overflow-hidden rounded-lg border border-white/10 shadow-lg">
          <div className="aspect-[3/4]">
            <img
              src={participants.self.image}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-[#0c0c20] py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-white/10">
          <Mic className="size-4 text-white/80" />
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-white/10">
          <Video className="size-4 text-white/80" />
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-red-500">
          <Phone className="size-4 rotate-[135deg] text-white" />
        </div>
      </div>

      {/* Home indicator spacer */}
      <div className="h-5 shrink-0 bg-[#0c0c20]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Android meeting – Gallery view                                     */
/* ------------------------------------------------------------------ */

export function AndroidMeetingPreview({ lang: _lang }: { lang: Locale }) {
  const grid = [
    participants.sarah,
    participants.alex,
    participants.jordan,
    participants.marcus,
  ];

  return (
    <div
      aria-hidden="true"
      className="flex size-full select-none flex-col bg-[#111127]"
    >
      {/* Status bar spacer */}
      <div className="h-8 shrink-0" />

      {/* 2x2 grid */}
      <div className="flex-1 grid grid-cols-2 gap-1 p-1">
        {grid.map((p) => (
          <div key={p.name} className="relative overflow-hidden rounded-md">
            <img
              src={p.image}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-3">
              <span className="text-[8px] font-medium text-white/80">
                {p.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 bg-[#0c0c20] py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
          <MicOff className="size-3.5 text-red-400" />
        </div>
        <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
          <Video className="size-3.5 text-white/80" />
        </div>
        <div className="flex size-8 items-center justify-center rounded-full bg-red-500">
          <Phone className="size-3.5 rotate-[135deg] text-white" />
        </div>
      </div>

      {/* Nav bar spacer */}
      <div className="h-4 shrink-0 bg-[#0c0c20]" />
    </div>
  );
}
