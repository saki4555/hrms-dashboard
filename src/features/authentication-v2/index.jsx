// src/features/authentication-v2/index.jsx

import React from "react";
import LoginFormV2 from "./login-form-v2";
import DemoCredentials from "@/components/demo-credentials";

const LoginV2 = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full pt-32 max-w-sm md:max-w-4xl">
        <LoginFormV2 />
        <DemoCredentials />
      </div>
    </div>
  );
};

export default LoginV2;