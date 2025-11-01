"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { MaintenanceSummaryCards } from "@/components/maintenance-summary-cards"
import { PredictionTable } from "@/components/prediction-table"
import { OdometerChart } from "@/components/odometer-chart"
import { MaintenanceCountChart } from "@/components/maintenance-count-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PredictiveMaintenanceDashboard() {
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <MaintenanceSummaryCards />

      {/* Alert for Urgent Maintenance */}
      <Alert variant="destructive" className="rounded-2xl border-red-500/50 bg-red-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Urgent Maintenance Required</AlertTitle>
        <AlertDescription>
          3 vehicles require immediate maintenance attention. Review the prediction table below for details.
        </AlertDescription>
      </Alert>

      {/* Filter Bar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Category:</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="mpv">MPV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="due-soon">Due Soon</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
              Generate Predictions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Maintenance Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <PredictionTable />
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Odometer Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <OdometerChart />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Predicted Maintenance Count by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceCountChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
