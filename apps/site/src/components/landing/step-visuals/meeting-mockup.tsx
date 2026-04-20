import {
  Hand,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Phone,
  Video,
  Volume2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { type Locale, t } from "../../../i18n/utils";

interface Participant {
  name: string;
  image: string;
  muted: boolean;
  speaking?: boolean;
}

const participants: Participant[] = [
  {
    name: "Sarah Chen",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop&crop=face",
    muted: false,
    speaking: true,
  },
  {
    name: "Alex Rivera",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face",
    muted: false,
  },
  {
    name: "Jordan Lee",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop&crop=face",
    muted: true,
  },
  {
    name: "Marcus Webb",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face",
    muted: false,
  },
];

const avatarThumbs = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
];

function Tile({ participant }: { participant: Participant }) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg bg-[#16162e]",
        participant.speaking &&
          "ring-[1.5px] ring-emerald-400/70 ring-offset-1 ring-offset-[#111127]",
      )}
    >
      <img
        src={participant.image}
        alt=""
        width={400}
        height={300}
        className="size-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent px-2 pb-1 pt-5">
        <span className="truncate text-[10px] font-medium text-white/90">
          {participant.name}
        </span>
        {participant.muted ? (
          <div className="flex size-[18px] items-center justify-center rounded-full bg-red-500/80">
            <MicOff className="size-2.5 text-white" />
          </div>
        ) : participant.speaking ? (
          <Volume2 className="size-3.5 text-emerald-400" />
        ) : (
          <Mic className="size-3 text-white/40" />
        )}
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  danger,
  active,
  label,
  badge,
}: {
  children: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full",
        danger
          ? "bg-red-500 text-white"
          : active
            ? "bg-white/[0.12] text-white/90"
            : "bg-white/[0.06] text-white/35",
      )}
    >
      {children}
      {badge != null && badge > 0 && (
        <div className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
          {badge}
        </div>
      )}
    </div>
  );
}

export function MeetingMockup({ lang }: { lang: Locale }) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl bg-[#111127] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04),0px_8px_8px_-8px_rgba(0,0,0,0.04),0px_0px_0px_1px_#fafafa] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.06),0px_2px_2px_rgba(0,0,0,0.3),0px_8px_8px_-8px_rgba(0,0,0,0.4)]"
    >
      <div className="flex h-10 items-center gap-2 border-b border-white/[0.05] bg-[#0c0c20] px-4">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-[#ff5f57]" />
          <div className="size-2.5 rounded-full bg-[#febc2e]" />
          <div className="size-2.5 rounded-full bg-[#28c840]" />
        </div>

        <div className="flex flex-1 items-center justify-center gap-2.5">
          <div className="flex items-center gap-1">
            <Lock className="size-3 text-emerald-400/70" />
            <span className="text-[11px] font-medium text-white/40">
              {t(lang, "mockups.meeting.title")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5">
            <div className="size-1.5 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-[10px] tabular-nums text-red-400/80">
              23:45
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex -space-x-1.5 rtl:space-x-reverse">
            {avatarThumbs.slice(0, 4).map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                width={24}
                height={24}
                className="size-6 rounded-full border border-[#0c0c20] object-cover"
                style={{ zIndex: 4 - i }}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2">
        {participants.map((p) => (
          <Tile key={p.name} participant={p} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-white/[0.05] bg-[#0c0c20] py-2.5">
        <ControlBtn active label={t(lang, "mockups.meeting.micOn")}>
          <Mic className="size-4" />
        </ControlBtn>
        <ControlBtn active label={t(lang, "mockups.meeting.cameraOn")}>
          <Video className="size-4" />
        </ControlBtn>
        <ControlBtn label={t(lang, "mockups.meeting.shareScreen")}>
          <MonitorUp className="size-4" />
        </ControlBtn>
        <ControlBtn label={t(lang, "mockups.meeting.raiseHand")}>
          <Hand className="size-4" />
        </ControlBtn>
        <ControlBtn label={t(lang, "mockups.meeting.chat")} badge={3}>
          <MessageSquare className="size-4" />
        </ControlBtn>
        <ControlBtn danger label={t(lang, "mockups.meeting.leaveCall")}>
          <Phone className="size-4 rotate-[135deg]" />
        </ControlBtn>
      </div>
    </div>
  );
}
