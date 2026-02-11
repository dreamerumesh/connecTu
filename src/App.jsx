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
          <Route path="/" element={<Chats />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
