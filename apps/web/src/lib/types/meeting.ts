import type { Participant } from "livekit-client";

export interface GridTile {
    id: string;
    participant: Participant;
    type: "camera" | "screen";
    isLocal: boolean;
    displayName: string;
}

export type ParticipantStatus = {
    audio: boolean;
    video: boolean;
    screen: boolean;
};
