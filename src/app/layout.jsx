import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserProviderWrapper from "@/components/providers/UserProviderWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

// Configure local fonts
const fellixMedium = localFont({
  src: "../fonts/Fellix-Medium.woff",
  variable: "--font-fellix",
  display: "swap",
});

const fellixSemiBold = localFont({
  src: "../fonts/Fellix-SemiBold.woff",
  variable: "--font-fellix-bold",
  display: "swap",
});

export const metadata = {
  title: "Patient Portal",
  description: "Dashboard for patient portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${fellixMedium.variable} ${fellixSemiBold.variable} font-sans antialiased`}
      >
        <UserProviderWrapper>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 10001 }}
            className="!z-[10001]"
          />
        </UserProviderWrapper>
      </body>
    </html>
  );
}
