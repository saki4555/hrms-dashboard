import axios from "axios";



export const getEmployees = async () => {
  const response = await axios.get(`api/get_employee.php`,{
    headers: {
        Authorization: "Bearer 123456",
    }
  });
  return response.data;
};
