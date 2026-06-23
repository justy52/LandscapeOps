import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  FileSignature,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  MapPinned,
  ReceiptText,
  Sprout,
  Users,
  WalletCards
} from "lucide-react";

export const navigationItems = [
  { name: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "#leads", icon: Users },
  { name: "Estimates", href: "#estimates", icon: FileText },
  { name: "Jobs", href: "#jobs", icon: BriefcaseBusiness },
  { name: "Schedule", href: "#schedule", icon: CalendarDays },
  { name: "Field Ops", href: "#field-ops", icon: HardHat },
  { name: "Invoices", href: "#invoices", icon: ReceiptText },
  { name: "Reports", href: "#reports", icon: BarChart3 }
];

export const dashboardMetrics = [
  {
    label: "Open pipeline",
    value: "$428K",
    detail: "Weighted residential and commercial opportunities.",
    trend: "+14%",
    trendDirection: "up" as const,
    icon: Gauge
  },
  {
    label: "Estimates pending",
    value: "18",
    detail: "Six need pricing review before client delivery.",
    trend: "+5",
    trendDirection: "up" as const,
    icon: FileSignature
  },
  {
    label: "Active jobs",
    value: "42",
    detail: "Install, enhancement, and maintenance work in production.",
    trend: "+8%",
    trendDirection: "up" as const,
    icon: Sprout
  },
  {
    label: "Overdue AR",
    value: "$31.6K",
    detail: "Invoices past due across four managed properties.",
    trend: "-9%",
    trendDirection: "down" as const,
    icon: WalletCards
  }
];

export const modulePreview = [
  {
    name: "Leads",
    status: "Hot",
    summary: "Capture inquiries, source, budget, site notes, and next actions.",
    icon: Users
  },
  {
    name: "Estimates",
    status: "Pricing",
    summary: "Build scope, labor, materials, margin, and proposal-ready totals.",
    icon: FileText
  },
  {
    name: "Jobs",
    status: "Live",
    summary: "Track production status from contract through closeout.",
    icon: BriefcaseBusiness
  },
  {
    name: "Schedule",
    status: "Crewed",
    summary: "Coordinate site visits, crews, equipment, and route pressure.",
    icon: CalendarDays
  },
  {
    name: "Field Ops",
    status: "Mobile",
    summary: "Punch lists, photos, daily notes, and site completion signals.",
    icon: ClipboardCheck
  },
  {
    name: "Invoices",
    status: "AR",
    summary: "Progress billing, payment status, and collection follow-up.",
    icon: ReceiptText
  },
  {
    name: "Reports",
    status: "Margin",
    summary: "Job costing, profitability, conversion, and crew utilization.",
    icon: BarChart3
  },
  {
    name: "Site Files",
    status: "R2",
    summary: "Photos, signed contracts, plans, and customer attachments.",
    icon: MapPinned
  }
];

export const schedulePreview = [
  {
    site: "Juniper Ridge Residence",
    crew: "Crew A - install prep and irrigation trench",
    time: "7:30 AM - 12:00 PM",
    status: "On track",
    color: "green" as const
  },
  {
    site: "Stonegate HOA",
    crew: "Crew C - weekly maintenance route",
    time: "9:00 AM - 2:30 PM",
    status: "Watch",
    color: "amber" as const
  },
  {
    site: "Northline Retail Plaza",
    crew: "Enhancement team - mulch and seasonal color",
    time: "1:00 PM - 5:00 PM",
    status: "Queued",
    color: "blue" as const
  }
];
