export interface Message {
    sender: string;
    text?: string;
    imageUrl?: string;
    timestamp: number;
    isLocal: boolean;
}
