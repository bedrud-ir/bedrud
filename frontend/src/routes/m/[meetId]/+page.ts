import { joinRoomAPI } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    try {
        const response = await joinRoomAPI({ roomName: params.meetId });
        return {
            meetingData: response
        };
    } catch (error) {
        console.error('Failed to join room:', error);
        return {
            meetingData: null,
            error: 'Failed to join meeting'
        };
    }
};
