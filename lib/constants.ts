import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileSignature,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  ReceiptText,
  Route,
  ShieldCheck,
  Sprout,
  TrendingUp,
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
    detail: "Weighted residential, HOA, and commercial opportunities.",
    trend: "+14%",
    trendLabel: "vs last month",
    trendDirection: "up" as const,
    tone: "green" as const,
    progress: 72,
    icon: Gauge
  },
  {
    label: "Estimates in review",
    value: "18",
    detail: "Six need pricing review before client delivery.",
    trend: "+5",
    trendLabel: "ready this week",
    trendDirection: "up" as const,
    tone: "brass" as const,
    progress: 58,
    icon: FileSignature
  },
  {
    label: "Active jobs",
    value: "42",
    detail: "Install, enhancement, and maintenance work in production.",
    trend: "+8%",
    trendLabel: "crew capacity",
    trendDirection: "up" as const,
    tone: "blue" as const,
    progress: 81,
    icon: Sprout
  },
  {
    label: "Overdue AR",
    value: "$31.6K",
    detail: "Invoices past due across four managed properties.",
    trend: "-9%",
    trendLabel: "collections risk",
    trendDirection: "down" as const,
    tone: "red" as const,
    progress: 36,
    icon: WalletCards
  }
];

export const commandPriorities = [
  {
    title: "Approve Juniper Ridge change order",
    detail: "Irrigation addendum is priced and waiting on margin approval.",
    owner: "Estimator",
    due: "Today, 10:30 AM",
    tone: "amber" as const,
    icon: FileSignature
  },
  {
    title: "Dispatch Crew C around Stonegate gate access",
    detail: "Route is profitable, but the HOA gate window is tight.",
    owner: "Ops manager",
    due: "Today, 8:45 AM",
    tone: "blue" as const,
    icon: Route
  },
  {
    title: "Collect Northline Retail progress invoice",
    detail: "$12.4K invoice is approved by PM and ready for payment follow-up.",
    owner: "Office",
    due: "Today, 2:00 PM",
    tone: "green" as const,
    icon: BadgeDollarSign
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
    crew: "Crew A",
    scope: "Install prep and irrigation trench",
    time: "7:30 AM - 12:00 PM",
    status: "On track",
    route: "12 min from yard",
    color: "green" as const
  },
  {
    site: "Stonegate HOA",
    crew: "Crew C",
    scope: "Weekly maintenance route and shrub cleanup",
    time: "9:00 AM - 2:30 PM",
    status: "Gate watch",
    route: "4 stops nearby",
    color: "amber" as const
  },
  {
    site: "Northline Retail Plaza",
    crew: "Enhancement team",
    scope: "Mulch, seasonal color, and photo closeout",
    time: "1:00 PM - 5:00 PM",
    status: "Queued",
    route: "Material drop set",
    color: "blue" as const
  }
];

export const fieldOpsPreview = [
  {
    label: "Photos uploaded",
    value: "126",
    detail: "42 tagged to install closeout",
    icon: Camera,
    tone: "green" as const
  },
  {
    label: "Punch items",
    value: "9",
    detail: "3 blocked by materials",
    icon: ClipboardCheck,
    tone: "amber" as const
  },
  {
    label: "Crew check-ins",
    value: "11/12",
    detail: "One late start flagged",
    icon: CheckCircle2,
    tone: "blue" as const
  }
];

export const pipelinePreview = [
  { label: "New leads", value: "24", width: "62%", tone: "bg-sky-500" },
  { label: "Site visits", value: "11", width: "44%", tone: "bg-landscape-brass" },
  { label: "Proposal review", value: "18", width: "58%", tone: "bg-amber-500" },
  { label: "Won this month", value: "$96K", width: "74%", tone: "bg-emerald-600" }
];

export const readinessSignals = [
  {
    label: "Org-scoped UI preview",
    detail: "Static demo only",
    icon: ShieldCheck,
    tone: "green" as const
  },
  {
    label: "No live queries",
    detail: "Phase 1 auth remains deferred",
    icon: AlertTriangle,
    tone: "amber" as const
  },
  {
    label: "Reporting posture",
    detail: "Margin and AR language ready",
    icon: TrendingUp,
    tone: "blue" as const
  },
  {
    label: "Client comms later",
    detail: "Email/SMS not wired",
    icon: MessageSquare,
    tone: "neutral" as const
  }
];

export const dayStats = [
  { label: "Crew hours scheduled", value: "93.5", icon: Clock3 },
  { label: "Projected gross margin", value: "41%", icon: TrendingUp },
  { label: "Billable sites today", value: "16", icon: MapPinned }
];
