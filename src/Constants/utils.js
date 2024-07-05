export const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    let formattedHours = hours % 12;
    formattedHours = formattedHours === 0 ? 12 : formattedHours; // Handle midnight (0 hours)

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const time = `${formattedHours}:${minutesStr} ${ampm}`;
    return time;
};

export const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);

    return `${hours}h ${minutes}m`;
};
