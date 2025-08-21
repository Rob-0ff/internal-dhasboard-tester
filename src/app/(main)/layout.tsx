import { ChatWidget } from "@/components/ui/chatWidget";
import { logout } from "../actions";
import Image from "next/image";

export default function mainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white p-4 border-b-2 border-purple-500">
        <div className="container mx-auto flex items-center justify-between">
          <Image
            src="/bag-learning-logo.png"
            alt="Bag Logo"
            // className="h-auto"
            height={75}
            width={75}
          />
          <nav className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="text-gray-700 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Dashboard
            </a>
            <button
              onClick={logout}
              className="text-gray-700 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container justify-center w-[100%]">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
