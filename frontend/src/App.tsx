import { Toaster } from "react-hot-toast";
import { AppRoutes } from "./routes/routes";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <AppRoutes />
    </>
  );
}


export default App;