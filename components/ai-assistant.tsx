"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Sparkles, Calendar, Car, AlertCircle, TrendingUp } from "lucide-react"

export function AIAssistant() {
  const quickActions = [
    { icon: Calendar, label: "Show today's bookings", color: "bg-blue-100 text-blue-600" },
    { icon: Car, label: "Available cars at Airport", color: "bg-green-100 text-green-600" },
    { icon: AlertCircle, label: "Open tickets summary", color: "bg-red-100 text-red-600" },
    { icon: TrendingUp, label: "This month's revenue", color: "bg-purple-100 text-purple-600" },
  ]

  const chatHistory = [
    {
      role: "assistant",
      message: "Hello! I'm your XQ Car AI Assistant. How can I help you today?",
      time: "10:30 AM",
    },
    {
      role: "user",
      message: "Show me all available SUVs at Airport Gate",
      time: "10:31 AM",
    },
    {
      role: "assistant",
      message:
        "I found 5 available SUVs at Airport Gate:\n\n1. Ford Explorer (BX5678) - Available\n2. Chevrolet Tahoe (EX7890) - Available\n3. Toyota Highlander (FX2345) - Available\n4. Honda Pilot (GX6789) - Available\n5. Mazda CX-9 (HX0123) - Available\n\nWould you like to see more details about any of these vehicles?",
      time: "10:31 AM",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">Chat with AI to manage your fleet operations</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-1 w-fit">
          <Sparkles className="h-3 w-3" />
          Powered by AI
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Area */}
        <Card className="rounded-2xl shadow-md lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Chat Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      chat.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{chat.message}</p>
                    <p
                      className={`text-xs mt-2 ${
                        chat.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {chat.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input placeholder="Ask me anything about your fleet..." className="flex-1" />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 bg-transparent"
                  >
                    <div className={`h-8 w-8 rounded-lg ${action.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-left">{action.label}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">I can help you with:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Finding available cars</li>
                  <li>Checking booking status</li>
                  <li>Viewing maintenance schedules</li>
                  <li>Analyzing fleet performance</li>
                  <li>Managing tickets and incidents</li>
                  <li>Generating reports</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
