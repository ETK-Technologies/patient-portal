// Default/empty profile data structure
export const initialProfileData = {
  fullName: "",
  email: "",
  dateOfBirth: "",
  phoneNumber: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  photoId: "",
  insuranceCard: "",
  password: "",
};

// Dummy data for design review (matching the design mockup)
export const dummyProfileData = {
  fullName: "Tymour Kadry",
  firstName: "Tymour",
  lastName: "Kadry",
  email: "tymitaly@yahoo.com",
  dateOfBirth: "September 13, 1984",
  phoneNumber: "(124) 356 4565",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  photoId: "Not provided",
  insuranceCard: "Not provided",
  password: "••••••••••",
};

export const profileFields = [
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email address" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "phoneNumber", label: "Phone number" },
  { key: "photoId", label: "Photo ID" },
  { key: "insuranceCard", label: "Insurance Card" },
  { key: "password", label: "Password" },
  // Additional fields (commented out for design review, uncomment when needed)
  // { key: "address", label: "Address" },
  // { key: "city", label: "City" },
  // { key: "province", label: "Province" },
  // { key: "postalCode", label: "Postal Code" },
];
