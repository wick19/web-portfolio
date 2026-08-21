import React from "react";
import App from "./App";
import { ProductModeProvider } from "./ProductModeContext";

function Container() {
  return (
    <ProductModeProvider>
      <App />
    </ProductModeProvider>
  );
}

export default Container;
