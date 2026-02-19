import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "../api/employeeApi";


export const useEmployeesOld = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
};
