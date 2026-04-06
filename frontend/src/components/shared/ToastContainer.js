import React from "react";
import { ToastContainer as TC } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ToastContainer = () => (
  <TC
    position="top-right"
    autoClose={4000}
    hideProgressBar={false}
    newestOnTop={true}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

export const showToast = (message, type = "info") => {
  const { toast } = require("react-toastify");
  toast[type](message);
};

export default ToastContainer;
