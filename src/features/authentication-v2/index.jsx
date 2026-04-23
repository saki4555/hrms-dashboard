// src/features/authentication-v2/index.jsx

import React from "react";
import LoginFormV2 from "./login-form-v2";

const LoginV2 = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginFormV2 />
      </div>
    </div>
  );
};

export default LoginV2;