"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, MessageCircle, Video, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function HelpCenterPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  const supportTickets = [
    {
      id: "T-001",
      title: "Unable to process invoice from new vendor",
      status: "Open",
      priority: "High",
      category: "Technical Issue",
      createdAt: "2024-01-15T10:30:00Z",
      lastUpdate: "2024-01-15T14:20:00Z",
      assignedTo: "Support Team",
    },
    {
      id: "T-002",
      title: "Question about payment approval workflow",
      status: "In Progress",
      priority: "Medium",
      category: "General Question",
      createdAt: "2024-01-14T09:15:00Z",
      lastUpdate: "2024-01-15T11:30:00Z",
      assignedTo: "Sarah Chen",
    },
    {
      id: "T-003",
      title: "Feature request: Bulk invoice upload",
      status: "Resolved",
      priority: "Low",
      category: "Feature Request",
      createdAt: "2024-01-12T16:45:00Z",
      lastUpdate: "2024-01-14T10:00:00Z",
      assignedTo: "Product Team",
    },
  ]

  const documentationSections = [
    {
      title: "Getting Started",
      description: "Learn the basics of using Invize",
      articles: 12,
      icon: BookOpen,
    },
    {
      title: "Invoice Processing",
      description: "How to process and manage invoices",
      articles: 18,
      icon: BookOpen,
    },
    {
      title: "Payment Management",
      description: "Managing payments and approvals",
      articles: 15,
      icon: BookOpen,
    },
    {
      title: "Vendor Management",
      description: "Working with vendors and suppliers",
      articles: 10,
      icon: BookOpen,
    },
    {
      title: "Analytics & Reporting",
      description: "Understanding reports and analytics",
      articles: 8,
      icon: BookOpen,
    },
    {
      title: "Administration",
      description: "System administration and settings",
      articles: 14,
      icon: BookOpen,
    },
  ]

  const trainingResources = [
    {
      title: "Invize Platform Overview",
      type: "Video",
      duration: "15 min",
      description: "Complete overview of the Invize platform and its features",
    },
    {
      title: "Invoice Processing Workflow",
      type: "Video",
      duration: "12 min",
      description: "Step-by-step guide to processing invoices efficiently",
    },
    {
      title: "Setting Up Vendor Profiles",
      type: "Video",
      duration: "8 min",
      description: "How to create and manage vendor profiles",
    },
    {
      title: "Payment Approval Process",
      type: "Video",
      duration: "10 min",
      description: "Understanding the payment approval workflow",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-destructive text-destructive-foreground"
      case "In Progress":
        return "bg-warning text-warning-foreground"
      case "Resolved":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive text-destructive-foreground"
      case "Medium":
        return "bg-warning text-warning-foreground"
      case "Low":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Help Center</h1>
          <p className="text-muted-foreground">Find answers, get support, and learn how to use Invize</p>
        </div>
        <div className="flex items-center gap-4">
          <Input placeholder="Search help articles..." className="w-64" />
          <Button className="bg-secondary hover:bg-secondary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      <Tabs defaultValue="documentation" className="w-full">
        <TabsList>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="training">Training Resources</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Browse our comprehensive documentation and guides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentationSections.map((section, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <section.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <CardDescription className="text-sm">{section.articles} articles</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">+1 from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">+2 from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4h</div>
                <p className="text-xs text-muted-foreground">Response time</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Track your support requests and their status</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedTicket === ticket.id ? "border-primary bg-muted/30" : "border-border"
                    }`}
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{ticket.id}</span>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                          <Badge variant="outline">{ticket.category}</Badge>
                        </div>
                        <h3 className="font-medium text-foreground">{ticket.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>Last update: {new Date(ticket.lastUpdate).toLocaleDateString()}</span>
                          <span>Assigned to: {ticket.assignedTo}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Resources</CardTitle>
              <CardDescription>Video tutorials and training materials to help you master Invize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainingResources.map((resource, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                          <Video className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {resource.type} • {resource.duration}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                      <Button className="mt-4 w-full bg-secondary hover:bg-secondary/90">
                        <Video className="h-4 w-4 mr-2" />
                        Watch Video
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get in touch with our support team for personalized assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Brief description of your issue" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="general">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Please provide detailed information about your issue or question..."
                      className="mt-1 min-h-32"
                    />
                  </div>
                  <Button className="w-full bg-secondary hover:bg-secondary/90">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
