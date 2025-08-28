"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useChatStore } from "@/context/ChatContext";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, 
  Star, 
  Edit3, 
  Trash2, 
  MoreHorizontal, 
  Settings, 
  LogOut, 
  User, 
  ChevronUp, 
  ChevronsLeft, 
  ChevronsRight,
  BarChart3 
} from "lucide-react";
import Logo, { LogoIcon } from "@/components/ui/Logo"; // Updated import
import Button from "@/components/ui/Button";
import { useState, useEffect, useMemo } from "react";

const NavItem = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-xl px-3 py-2 text-sm font-medium",
        active
          ? "bg-[#1f7daf] text-white"
          : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-white/5"
      )}
    >
      {label}
    </Link>
  );
};

// Chat item component with management controls
function ChatItem({ chat, isActive, onStar, onRename, onDelete, isCollapsed }: {
  chat: any;
  isActive: boolean;
  onStar: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  isCollapsed: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      onRename(chat.id, editTitle.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(chat.title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <li className="px-3 py-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyPress}
          className="w-full text-sm bg-transparent border-b border-neutral-300 dark:border-neutral-600 outline-none"
          autoFocus
        />
      </li>
    );
  }

  return (
    <li className="group relative">
      <Link
        href={`/chat?c=${chat.id}`}
        className={clsx(
          // Base (always keep a border to avoid first-focus default black border in light mode)
          "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] border",
          isActive
            ? // Active: explicit border & subtle bg to avoid default UA focus border
              "bg-blue-100/60 dark:bg-blue-950/40 text-neutral-900 dark:text-neutral-100 border-blue-200/50 dark:border-transparent"
            : // Inactive: ensure border stays transparent so first click doesn't flash black
              "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-white/5 border-transparent focus:border-transparent focus-visible:border-transparent"
        )}
        title={chat.title} // Show full title on hover
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {chat.starred && <Star size={12} className="text-yellow-500 flex-shrink-0" />}
          <span className={clsx(
            "truncate transition-all duration-300",
            isCollapsed 
              ? "opacity-0 w-0 overflow-hidden whitespace-nowrap" 
              : "opacity-100"
          )}>
            {chat.title || "New conversation"}
          </span>
        </div>
        <div className={clsx(
          "flex items-center gap-1 flex-shrink-0 transition-all duration-300",
          isCollapsed 
            ? "opacity-0 w-0 overflow-hidden" 
            : "opacity-100"
        )}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            className={clsx(
              "opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity",
              isActive 
                ? "hover:bg-blue-200/60 dark:hover:bg-blue-900/40" // Subtle blue hover for active state
                : "hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50"
            )}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </Link>
      
      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-2 top-full mt-1 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 py-2 z-10 min-w-[140px]">
          <button
            onClick={() => {
              onStar(chat.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50/80 dark:hover:bg-neutral-700/80 flex items-center gap-3 rounded-lg mx-1 transition-colors"
          >
            <Star size={14} className={chat.starred ? "text-yellow-500" : "text-neutral-400"} />
            {chat.starred ? "Unstar" : "Star"}
          </button>
          <button
            onClick={() => {
              setIsEditing(true);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50/80 dark:hover:bg-neutral-700/80 flex items-center gap-3 rounded-lg mx-1 transition-colors"
          >
            <Edit3 size={14} className="text-neutral-400" />
            Rename
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this chat?")) {
                onDelete(chat.id);
              }
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50/80 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-3 rounded-lg mx-1 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function Sidebar() {
  const { conversations, initialized, starChat, renameChat, deleteChat, activeId, setActive } = useChatStore();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { token, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Decode user info from JWT token
  const user = useMemo(() => {
    if (!token) return null;
    
    try {
      const payload = token.split(".")[1];
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      const claims = JSON.parse(json);
      
      return {
        name: claims.name || claims.full_name || "User",
        email: claims.email || "",
        avatar: claims.avatar || claims.picture || null
      };
    } catch (error) {
      console.error("Failed to decode user info from token:", error);
      return {
        name: "User",
        email: "",
        avatar: null
      };
    }
  }, [token]);

  const handleNewChat = () => {
    // Navigate to the new chat page instead of creating a chat immediately
    router.push('/new');
  };

  // Sort conversations: starred first, then by updated date
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return 0; // Keep existing order for same star status
  });

  // Effect to sync activeId with URL params
  useEffect(() => {
    if (pathname === "/chat") {
      const urlChatId = new URLSearchParams(window.location.search).get("c");
      if (urlChatId && urlChatId !== activeId) {
        setActive(urlChatId);
      }
    } else if (pathname === "/new" || pathname === "/") {
      // Clear active chat when on the new chat page or dashboard
      if (activeId) {
        setActive("");
      }
    }
  }, [pathname, activeId, setActive]);

  return (
    <aside 
      className={clsx(
        "border-r border-neutral-200 dark:border-white/10 p-4 bg-blue-50/30 dark:bg-neutral-950/40 backdrop-blur flex flex-col h-full transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
      data-sidebar="true"
      onClick={isCollapsed ? toggleSidebar : undefined}
    >
      {/* Header with logo/toggle button */}
      <div className="mb-8 flex items-center">
        {/* Logo container - always in the same position */}
        <div className="relative">
          <LogoIcon size="sm" className="cursor-pointer" />
          {/* Text that slides in/out */}
          <div className={clsx(
            "absolute left-12 top-0 flex items-center h-9 transition-all duration-300",
            isCollapsed 
              ? "opacity-0 translate-x-2 pointer-events-none" 
              : "opacity-100 translate-x-0"
          )}>
            <span className="text-xl font-semibold bg-gradient-to-r from-[#1f7daf] to-[#104f73] bg-clip-text text-transparent">
              Olaji
            </span>
          </div>
        </div>
        
        {/* Spacer to push toggle button to the right */}
        <div className="flex-1" />
        
        {/* Toggle button - delay appearance to avoid overlap */}
        <div className={clsx(
          "transition-all duration-300",
          isCollapsed 
            ? "opacity-0 w-0 overflow-hidden delay-0" 
            : "opacity-100 delay-150"
        )}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-neutral-100/70 dark:hover:bg-white/5 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronsLeft size={20} />
          </button>
        </div>
      </div>
      
      {/* Navigation with sidebar-style buttons */}
      <nav className="space-y-2 mb-6" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => router.push('/')}
          className={clsx(
            "w-full flex items-center gap-3 text-sm font-medium rounded-xl p-2",
            pathname === "/"
              ? "bg-blue-100/70 dark:bg-blue-950/30 text-[#1f7daf] dark:text-[#3caedb]"
              : "text-[#1f7daf] dark:text-[#3caedb] hover:bg-neutral-100/70 dark:hover:bg-white/5"
          )}
          title="Dashboard"
        >
          <div className="w-8 h-8 rounded-full bg-[#1f7daf] flex items-center justify-center text-white flex-shrink-0">
            <BarChart3 size={16} />
          </div>
          <span className={clsx(
            "whitespace-nowrap transition-all duration-300",
            isCollapsed 
              ? "opacity-0 w-0 overflow-hidden" 
              : "opacity-100"
          )}>
            Dashboard
          </span>
        </button>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-white/5 rounded-xl p-2"
          title="New Chat"
        >
          <div className="w-8 h-8 rounded-full bg-[#1f7daf] flex items-center justify-center text-white flex-shrink-0">
            <Plus size={16} />
          </div>
          <span className={clsx(
            "whitespace-nowrap transition-all duration-300",
            isCollapsed 
              ? "opacity-0 w-0 overflow-hidden" 
              : "opacity-100"
          )}>
            New Chat
          </span>
        </button>
        <button 
          onClick={() => router.push('/tools')}
          className="w-full flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-white/5 rounded-xl p-2"
          title="Tools"
        >
          <div className="w-8 h-8 rounded-full bg-neutral-500 flex items-center justify-center text-white flex-shrink-0">
            <Settings size={16} />
          </div>
          <span className={clsx(
            "whitespace-nowrap transition-all duration-300",
            isCollapsed 
              ? "opacity-0 w-0 overflow-hidden" 
              : "opacity-100"
          )}>
            Tools
          </span>
        </button>
      </nav>

      {/* Chat History Section - only show when expanded */}
      {!isCollapsed && (
        <>
          <div className={clsx(
            "mb-2 transition-all duration-300",
            isCollapsed 
              ? "opacity-0 w-0 overflow-hidden" 
              : "opacity-100"
          )}>
            <h3 className="text-sm font-semibold opacity-70 whitespace-nowrap">Your Chats</h3>
          </div>

          <div className="flex-1 min-h-0">
            <ul className="space-y-1 h-full overflow-auto pr-1">
              {!initialized ? (
                <li className={clsx(
                  "text-sm opacity-60 transition-all duration-300",
                  isCollapsed 
                    ? "opacity-0 w-0 overflow-hidden" 
                    : "opacity-100"
                )}>
                  <span className="whitespace-nowrap">Loading...</span>
                </li>
              ) : conversations.length === 0 ? (
                <li className={clsx(
                  "text-sm opacity-60 transition-all duration-300",
                  isCollapsed 
                    ? "opacity-0 w-0 overflow-hidden" 
                    : "opacity-100"
                )}>
                  <span className="whitespace-nowrap">No chats yet</span>
                </li>
              ) : (
                sortedConversations.map((c) => {
                  const isActive = c.id === activeId;
                  
                  return (
                    <ChatItem
                      key={c.id}
                      chat={c}
                      isActive={isActive}
                      onStar={starChat}
                      onRename={renameChat}
                      onDelete={deleteChat}
                      isCollapsed={isCollapsed}
                    />
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}

      {/* Spacer to push user section to bottom when collapsed */}
      {isCollapsed && <div className="flex-1" />}

      {/* User Section */}
      {user && (
        <div className="relative mt-4 border-t border-neutral-200 dark:border-white/10 pt-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center p-3 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-white/5 transition-colors relative"
            title={isCollapsed ? `${user.name} - ${user.email}` : undefined}
          >
            {/* Avatar - always in the same position */}
            <div className="w-10 h-10 rounded-full bg-[#1f7daf] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm">{user.name.split(' ').map(n => n[0]).join('')}</span>
              )}
            </div>
            
            {/* User info that slides in/out - positioned to align with avatar center */}
            <div className={clsx(
              "absolute left-16 top-1/2 -translate-y-1/2 flex items-center justify-between transition-all duration-300",
              isCollapsed 
                ? "opacity-0 translate-x-2 pointer-events-none w-0 overflow-hidden" 
                : "opacity-100 translate-x-0",
              !isCollapsed && "right-3" // Take full width when expanded
            )}>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate whitespace-nowrap">{user.name}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate whitespace-nowrap">{user.email}</div>
              </div>
              <ChevronUp 
                size={16} 
                className={`text-neutral-400 transition-transform flex-shrink-0 ml-2 ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className={clsx(
              "absolute bottom-full mb-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10",
              isCollapsed ? "left-full ml-2 w-48" : "left-0 right-0"
            )}>
              <button
                onClick={() => {
                  router.push('/settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
              >
                <Settings size={16} />
                Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}