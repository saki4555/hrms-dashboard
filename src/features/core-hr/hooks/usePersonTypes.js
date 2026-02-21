import { useQuery } from "@tanstack/react-query";
import { getPersonTypes } from "../api/employeeApi";


export const usePersonTypesOld = () => {
    return useQuery({
        queryKey: ["personTypes"],
        queryFn: getPersonTypes,
        staleTime: 1000 * 60 * 60 * 24,
    })
} 