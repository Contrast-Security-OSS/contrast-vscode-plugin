const convertTo12HourFormat = (hour: string | number) => {
  hour = typeof hour === 'string' ? parseInt(hour, 10) : hour;
  const isPM = hour >= 12; // Determine if it's PM
  const convertedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour; // Convert to 12-hour format
  return `${convertedHour} ${isPM ? 'PM' : 'AM'}`; // Create the label
};
export { convertTo12HourFormat };
