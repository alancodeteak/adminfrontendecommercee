import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { restoreSession } from "./features/auth/authThunks.js";

store.dispatch(restoreSession());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
