// day and time are interpreted as Indian Standard Time (UTC+05:30).
const IST_TIME_ZONE = "Asia/Kolkata";

const parseScheduledInstant = (day, time) => {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
        return {
            error: "Use day format YYYY-MM-DD and time format HH:mm"
        };
    }

    const scheduledAt = new Date(`${day}T${time}:00+05:30`);

    if (Number.isNaN(scheduledAt.getTime())) {
        return { error: "Please provide a valid date" };
    }

    // Compare the IST calendar day. toISOString() is UTC, so times
    // from 00:00 through 05:29 would otherwise look like the previous day.
    const istDay = new Intl.DateTimeFormat("en-CA", {
        timeZone: IST_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(scheduledAt);

    if (istDay !== day) {
        return { error: "Please provide a valid date" };
    }

    return { scheduledAt };
};

module.exports = { parseScheduledInstant };
