export const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(/\s+/);
    if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
};
