import { UserProvider } from "./UserContext";
import { ChatProvider } from "./ChatContext";
export const AppProvider = ({ children }) => {
  return (
    <UserProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
    </UserProvider>
    );
};