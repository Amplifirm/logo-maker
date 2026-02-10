import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, TrendingUp, Users, Clock, DollarSign, Activity } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Calls",
      value: "2,847",
      change: "+12.5%",
      icon: Phone,
      color: "text-blue-500",
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+8.2%",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Avg. Call Duration",
      value: "4:32",
      change: "-2.1%",
      icon: Clock,
      color: "text-purple-500",
    },
    {
      title: "Revenue",
      value: "€24,500",
      change: "+23.1%",
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Success Rate",
      value: "94.2%",
      change: "+5.4%",
      icon: TrendingUp,
      color: "text-orange-500",
    },
    {
      title: "Active Campaigns",
      value: "18",
      change: "+3",
      icon: Activity,
      color: "text-pink-500",
    },
  ]

  const recentCalls = [
    { id: 1, contact: "John Smith", duration: "5:23", status: "Completed", time: "2 min ago" },
    { id: 2, contact: "Sarah Johnson", duration: "3:45", status: "Completed", time: "5 min ago" },
    { id: 3, contact: "Mike Wilson", duration: "1:12", status: "Missed", time: "8 min ago" },
    { id: 4, contact: "Emma Davis", duration: "6:34", status: "Completed", time: "12 min ago" },
    { id: 5, contact: "Alex Brown", duration: "4:56", status: "Completed", time: "15 min ago" },
  ]

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
            <button className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-blue-700 transition-all">
              New Campaign
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <p className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
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
            <CardHeader>
              <CardTitle className="text-white">Recent Calls</CardTitle>
              <CardDescription className="text-gray-400">Latest call activity from your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{call.contact}</p>
                        <p className="text-xs text-gray-400">{call.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{call.duration}</p>
                      <p className={`text-xs ${call.status === 'Completed' ? 'text-green-500' : 'text-red-500'}`}>
                        {call.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Call Volume</CardTitle>
              <CardDescription className="text-gray-400">Calls per day over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {[45, 52, 38, 65, 48, 72, 58].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-purple-600 to-blue-600 rounded-t-lg transition-all hover:from-purple-500 hover:to-blue-500"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-400">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
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
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group">
                <Phone className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white">Start Call</p>
                <p className="text-xs text-gray-400">Begin new campaign</p>
              </button>
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group">
                <Users className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white">Add Contacts</p>
                <p className="text-xs text-gray-400">Import contact list</p>
              </button>
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group">
                <Activity className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white">View Reports</p>
                <p className="text-xs text-gray-400">Analyze performance</p>
              </button>
              <button className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left group">
                <TrendingUp className="h-8 w-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-white">Optimize</p>
                <p className="text-xs text-gray-400">AI suggestions</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}