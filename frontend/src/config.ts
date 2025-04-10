import type { User } from "$lib/stores/user.store";
import Users from "lucide-svelte/icons/users";
import Settings from "lucide-svelte/icons/settings";
import Home from "lucide-svelte/icons/home";
import LogOut from "lucide-svelte/icons/log-out";

export const brand = {
    name: "Bedrud",
    color: "#4f46e5" // Indigo-600, you can change this to any color you prefer
};

export const getAdminConfig = (user: User) => ({
    brand,
    user: {
        name: user.name,
        email: user.email,
        avatar: user.pictureUrl || null
    },
    navMain: [
        {
            title: "Users",
            url: "/admin/users",
            icon: Users,
            items: []
        },
        {
            title: "Rooms",
            url: "/admin/rooms",
            icon: Home,
            items: []
        },
        {
            title: "Settings",
            url: "/admin/settings",
            icon: Settings,
            items: []
        }
    ],
    navSecondary: [
    ],
    projects: [] 
});
