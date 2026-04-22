import type { Metadata } from "next";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timviz",
  description:
    "Платформа онлайн-записи для салонов, барбершопов, мастеров и клиентов с будущей интеграцией Telegram-бота."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <GlobalLanguageSwitcher />
        {children}
      </body>
    </html>
  );
}
