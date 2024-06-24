export const parseDateTimeToMonthShort = (dateTime: string) => {
    return new Date(dateTime)
        .toLocaleDateString("en-GB", { month: "short" })
        .toUpperCase()
}

export const parseDateTimeToDay = (dateTime: string) => {
    return new Date(dateTime)
        .toLocaleDateString("en-GB", { day: "numeric" })
        .toUpperCase()
}
