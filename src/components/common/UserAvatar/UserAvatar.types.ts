export interface UserAvatarMenuItem {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
    divider?: boolean;
}

export interface UserAvatarProps {
    userName?: string;
    userEmail?: string;
    avatarUrl?: string;
    role?: "admin" | "seller" | "user";
    menuItems?: UserAvatarMenuItem[];
    onLogout?: () => void;
}
