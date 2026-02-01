export const formatLog = (gameId: string, message: string) => {
    const now = new Date();
    const timeStr = now.toISOString().split('T')[1].split('.')[0] + ' UTC';
    return `[${gameId}] [${timeStr}] ${message}`;
};
