import { useQuery } from "@tanstack/react-query";
import { getEmployeeById } from "../api/employeeApi";

export const useEmployee = (empNo) => {
  return useQuery({
    queryKey: ["employee", empNo],
    queryFn: () => {
      if (!empNo) {
        return Promise.reject(new Error("Employee ID is required"))
      }
      return getEmployeeById(empNo);
    },
    enabled: !!empNo,
    staleTime: 1000 * 60 * 5,
  });
};
