"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Activity,
  RefreshCw,
  Play,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { webhookApi } from "@/lib/api";
import { config } from "@/lib/config";
import type { WebhookEvent } from "@/lib/types";
import { formatDistance } from "date-fns";

export default function WebhooksPage() {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const loadWebhookEvents = async () => {
    try {
      setLoading(true);
      const response = await webhookApi.getEvents(config.defaultTestData.vendorId);
      setWebhookEvents(response.data);
    } catch (error) {
      console.error("Failed to load webhook events:", error);
    } finally {
      setLoading(false);
    }
  };

  const processWebhooks = async () => {
    try {
      setProcessing(true);
      await webhookApi.processEvents();
      // Reload events after processing
      await loadWebhookEvents();
    } catch (error) {
      console.error("Failed to process webhooks:", error);
    } finally {
      setProcessing(false);
    }
  };

  const cleanupWebhooks = async () => {
    try {
      await webhookApi.cleanup();
      await loadWebhookEvents();
    } catch (error) {
      console.error("Failed to cleanup webhooks:", error);
    }
  };

  useEffect(() => {
    loadWebhookEvents();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      delivered: "default",
      failed: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: webhookEvents.length,
    pending: webhookEvents.filter(e => e.status === 'pending').length,
    delivered: webhookEvents.filter(e => e.status === 'delivered').length,
    failed: webhookEvents.filter(e => e.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage webhook event deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadWebhookEvents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={processWebhooks} disabled={processing}>
            {processing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Process Pending
              </>
            )}
          </Button>
          <Button onClick={cleanupWebhooks} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Old
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Webhook events created
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              Successfully sent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Delivery failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>
            All webhook events and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Last Attempt</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhookEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs">
                    {event.id.substring(0, 12)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.status)}
                      {event.event_type}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(event.status)}
                  </TableCell>
                  <TableCell>
                    <span className={event.attempts > 1 ? "text-yellow-600 font-medium" : ""}>
                      {event.attempts}
                    </span>
                    {event.attempts >= 3 && (
                      <span className="text-red-500 ml-1">⚠️</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {event.last_attempt_at 
                      ? formatDistance(new Date(event.last_attempt_at), new Date(), { addSuffix: true })
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    {formatDistance(new Date(event.created_at), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Webhook Event Details</DialogTitle>
                          <DialogDescription>
                            Event ID: {event.id}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedEvent && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Event Type</h4>
                                <p className="text-sm text-muted-foreground">{selectedEvent.event_type}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Status</h4>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(selectedEvent.status)}
                                  {getStatusBadge(selectedEvent.status)}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Attempts</h4>
                                <p className="text-sm text-muted-foreground">{selectedEvent.attempts} / 3</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Created</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(selectedEvent.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Payload</h4>
                              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-64">
                                {JSON.stringify(selectedEvent.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {webhookEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No webhook events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Webhook Delivery Information
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Webhooks are automatically retried up to 3 times with exponential backoff</li>
                <li>• Delivery timeout is set to 30 seconds per attempt</li>
                <li>• Events are triggered for payment_intent state changes and subscription renewals</li>
                <li>• Use &quot;Process Pending&quot; to manually retry failed deliveries</li>
                <li>• &quot;Cleanup Old&quot; removes successfully delivered events older than 7 days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
