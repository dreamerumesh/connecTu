import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Chats from "./pages/Chats";
import { Toaster } from "react-hot-toast";

function App() {
  return (
     <>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/chats" element={<Chats />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
