// utils/allowedMonth.ts
const allowedMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Function to validate a month
  export const isValidMonth = (month: string): boolean => {
    return allowedMonths.includes(month);
  };
  
  // Optionally, export the list of allowed months
  export default allowedMonths;
  