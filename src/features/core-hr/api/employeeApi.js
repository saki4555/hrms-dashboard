import axios from "axios";


export const getEmployees = async () => {
  const response = await axios.get(`/api/get_employee.php`,{
    headers: {
        Authorization: "Bearer 123456",
    }
  });
  return response.data;
};

export const getEmployeeById = async (empNo) => {
  const response = await axios.get(`/api/get_employee.php?emp_no=${empNo}`, {
    headers: {
      Authorization: 'Bearer 123456'
    }
  })
  return response.data;
}

export const getPersonTypes = async () => {
  const response = await axios.get('/api/get_person_type.php', {
    headers: {
      Authorization: 'Bearer 123456',
    }
  })
  return response.data;
}
