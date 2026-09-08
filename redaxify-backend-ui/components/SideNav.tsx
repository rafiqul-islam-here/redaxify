"use client"
import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  ChevronDown,
  Video,
  Brain,
  Settings,
  Music,
  FileText,
  ScanText,
  MessageSquare,
  Landmark,
  IdCard,
  ReceiptText,
} from "lucide-react"

const menuItems = [
  {
    category: "Video",
    items: [
      { icon: Video, text: "Index Video", link: "/video", disabled: false },
      { icon: Brain, text: "AI Video", link: "/video", disabled: true },
      { icon: Settings, text: "Video Tools", link: "/video", disabled: true },
    ],
  },
  {
    category: "Audio",
    items: [
      { icon: Music, text: "Audio Indexing", link: "/audio", disabled: false },
      { icon: Brain, text: "AI Audio", link: "/tools", disabled: true },
      { icon: Settings, text: "Audio Tools", link: "/tools", disabled: true },
    ],
  },
  {
    category: "Document",
    items: [
      {
        icon: FileText,
        text: "Document",
        link: "/document",
        disabled: false,
        children: [
          { icon: Landmark, text: "US Tax", link: "/document/us-tax", disabled: false },
          { icon: IdCard, text: "Identity Document", link: "/document/identity-document", disabled: false },
          { icon: ReceiptText, text: "Invoice", link: "/document/invoice", disabled: false },
        ],
      },
      { icon: ScanText, text: "OCR", link: "/ocr", disabled: false },
      { icon: Brain, text: "AI Documents", link: "/tools", disabled: true },
      { icon: Settings, text: "Document Tools", link: "/tools", disabled: true },
    ],
  },
  {
    category: "Support",
    items: [
      { icon: MessageSquare, text: "Feedback Form", link: "/support", disabled: false },
    ],
  },
]

const SideNav = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const toggleMenu = (text: string) => {
    setOpenMenu(openMenu === text ? null : text)
  }

  return (
    <div className="bg-gradient-to-l from-[#242648] to-[#1C1C3A] w-60 h-[calc(100vh-3rem)] px-2 fixed top-12 left-0 border-r-2 border-r-[#2C2E4B] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2C2E4B] scrollbar-track-[#1C1C3A]">
      <div className="w-full mt-6 space-y-6">
        {menuItems.map((section, index) => (
          <div key={index}>
            <span className="px-4 text-sm font-bold text-[#636376] uppercase">
              {section.category}
            </span>
            <ul className="flex flex-col px-4 pt-1.5 space-y-0">
              {section.items.map((item, idx) => {
                const Icon = item.icon
                return (
                  <li key={idx} className="text-white">
                    {item.disabled ? (
                      <div className="flex items-center text-[15px] gap-2 px-4 py-1.5 rounded-xl opacity-50 cursor-not-allowed">
                        <Icon size={20} />
                        {item.text}
                      </div>
                    ) : (
                      <div>
                        {item.children ? (
                          <button
                            onClick={() => toggleMenu(item.text)}
                            className="flex items-center justify-between w-full text-left text-[15px] gap-2 hover:bg-gray-600 px-4 py-1.5 rounded-xl"
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={20} />
                              {item.text}
                            </div>
                            {openMenu === item.text ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        ) : (
                          <Link
                            href={item.link}
                            className="flex items-center text-[15px] gap-2 hover:bg-gray-600 px-4 py-1.5 rounded-xl"
                          >
                            <Icon size={20} />
                            {item.text}
                          </Link>
                        )}

                        {item.children && openMenu === item.text && (
                          <ul className="ml-6 mt-1 space-y-1">
                            {item.children.map((child, cidx) => {
                              const ChildIcon = child.icon
                              return (
                                <li key={cidx}>
                                  <Link
                                    href={child.link}
                                    className="flex items-center text-sm gap-2 hover:bg-gray-600 px-3 py-1.5 rounded-lg"
                                  >
                                    <ChildIcon size={16} />
                                    {child.text}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SideNav
