import { Toaster } from "react-hot-toast";
import { AppRoutes } from "./routes/routes";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 99999999,
        }}
        toastOptions={{
          style: {
            zIndex: 99999999,
          },
        }}
      />
      <AppRoutes />
    </>
  );
}


export default App;