// Later replace fetch with real API endpoint
export async function fetchCurrentUser() {
  const userData = localStorage.getItem("authUser");

  if (userData) {
    return JSON.parse(userData);
  }

  // Demo default user (remove when backend exists)
  const demoUser = {
    name: "Demo User",
    role: "Admin", // Admin | HR | Supervisor | Employee
  };

  localStorage.setItem("authUser", JSON.stringify(demoUser));
  return demoUser;
}

// Write real token to storage later
export function saveUser(user) {
  localStorage.setItem("authUser", JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem("authUser");
}
