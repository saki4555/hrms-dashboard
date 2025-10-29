import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "../api/employeeApi";


export const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
};
