import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import RouteGuard from "@/components/RouteGuard";
import { dayjs } from "@jstiava/chronos";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

if (typeof window !== "undefined") {
    const userTz = dayjs.tz.guess();
    dayjs.tz.setDefault(userTz);
}

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#1976d2" },
        secondary: { main: "#dc004e" },
    },
    typography: {
        fontFamily: ["Arial", "Helvetica", "sans-serif"].join(","),
    },
});

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <RouteGuard>
                <Component {...pageProps} />
            </RouteGuard>
        </ThemeProvider>
    );
}
