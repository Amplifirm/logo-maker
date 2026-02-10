import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, TrendingUp, Users, Clock, DollarSign, Activity, Plus, ArrowUpRight } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Calls",
      value: "2,847",
      change: "+12.5%",
      icon: Phone,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+8.2%",
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Avg. Call Duration",
      value: "4:32",
      change: "-2.1%",
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Revenue",
      value: "€24,500",
      change: "+23.1%",
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Success Rate",
      value: "94.2%",
      change: "+5.4%",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-100",
    },
    {
      title: "Active Campaigns",
      value: "18",
      change: "+3",
      icon: Activity,
      color: "text-pink-500",
      bgColor: "bg-pink-100",
    },
  ]

  const recentCalls = [
    { id: 1, contact: "John Smith", duration: "5:23", status: "Completed", time: "2 min ago", outcome: "Interested" },
    { id: 2, contact: "Sarah Johnson", duration: "3:45", status: "Completed", time: "5 min ago", outcome: "Callback" },
    { id: 3, contact: "Mike Wilson", duration: "1:12", status: "Missed", time: "8 min ago", outcome: "No Answer" },
    { id: 4, contact: "Emma Davis", duration: "6:34", status: "Completed", time: "12 min ago", outcome: "Converted" },
    { id: 5, contact: "Alex Brown", duration: "4:56", status: "Completed", time: "15 min ago", outcome: "Interested" },
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      Completed: "text-green-600 bg-green-50 border-green-200",
      Missed: "text-red-600 bg-red-50 border-red-200",
      InProgress: "text-blue-600 bg-blue-50 border-blue-200",
    }
    return colors[status as keyof typeof colors] || colors.Completed
  }

  const getOutcomeColor = (outcome: string) => {
    const colors = {
      Converted: "text-emerald-700",
      Interested: "text-blue-700",
      Callback: "text-amber-700",
      "No Answer": "text-gray-500",
    }
    return colors[outcome as keyof typeof colors] || colors.Interested
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">Welcome back, Ali</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Campaign
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor.replace('100', '900/50')}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className={`w-3 h-3 ${stat.change.startsWith('-') ? 'rotate-180' : ''}`} />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Calls */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Calls</CardTitle>
                <CardDescription className="text-gray-400">Latest call activity from your campaigns</CardDescription>
              </div>
              <button className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <span>View all</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{call.contact}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">{call.time}</p>
                          <span className="text-gray-600">•</span>
                          <p className={`text-xs font-medium ${getOutcomeColor(call.outcome)}`}>
                            {call.outcome}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-medium text-white">{call.duration}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Call Volume</CardTitle>
              <CardDescription className="text-gray-400">Calls per day over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-end justify-between gap-2">
                {[
                  { height: 45, calls: 124, day: 'Mon' },
                  { height: 52, calls: 143, day: 'Tue' },
                  { height: 38, calls: 98, day: 'Wed' },
                  { height: 65, calls: 178, day: 'Thu' },
                  { height: 48, calls: 132, day: 'Fri' },
                  { height: 72, calls: 198, day: 'Sat' },
                  { height: 58, calls: 156, day: 'Sun' },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-purple-600 to-blue-600 rounded-t-lg transition-all hover:from-purple-500 hover:to-blue-500 cursor-pointer"
                        style={{ height: `${(item.height / 72) * 240}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.calls} calls
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{item.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group border border-gray-700/50 hover:border-gray-600">
                <Phone className="h-8 w-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white mb-1">Start Call</p>
                <p className="text-xs text-gray-400">Begin new campaign</p>
              </button>
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group border border-gray-700/50 hover:border-gray-600">
                <Users className="h-8 w-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white mb-1">Add Contacts</p>
                <p className="text-xs text-gray-400">Import contact list</p>
              </button>
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group border border-gray-700/50 hover:border-gray-600">
                <Activity className="h-8 w-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white mb-1">View Reports</p>
                <p className="text-xs text-gray-400">Analyze performance</p>
              </button>
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group border border-gray-700/50 hover:border-gray-600">
                <TrendingUp className="h-8 w-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white mb-1">Optimize</p>
                <p className="text-xs text-gray-400">AI suggestions</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}