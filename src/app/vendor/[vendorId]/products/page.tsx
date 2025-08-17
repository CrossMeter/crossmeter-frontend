"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  DollarSign,
  Calendar,
  Activity
} from "lucide-react";
import { productApi } from "@/lib/api";
import type { Product, CreateProductRequest, PricingModel } from "@/lib/types";
import { formatDistance } from "date-fns";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  pricing_model: z.enum(["one_off", "monthly", "pay_per_use"]),
  price_cents: z.number().min(1, "Price must be greater than 0"),
  usage_limit: z.number().optional(),
  billing_interval_days: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ProductsPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      pricing_model: "one_off",
      price_cents: 1000, // $10.00
      usage_limit: undefined,
      billing_interval_days: 30,
    },
  });

  const pricingModel = form.watch("pricing_model");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll(vendorId);
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [vendorId]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const productData: CreateProductRequest = {
        vendor_id: vendorId,
        name: data.name,
        description: data.description || undefined,
        pricing_model: data.pricing_model,
        price_cents: data.price_cents,
        usage_limit: data.pricing_model === "pay_per_use" ? data.usage_limit : undefined,
        billing_interval_days: data.pricing_model === "monthly" ? data.billing_interval_days : undefined,
      };

      if (editingProduct) {
        await productApi.update(vendorId, editingProduct.id!, productData);
      } else {
        await productApi.create(productData);
      }

      await loadProducts();
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      pricing_model: product.pricing_model,
      price_cents: product.price_cents,
      usage_limit: product.usage_limit,
      billing_interval_days: product.billing_interval_days || 30,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await productApi.delete(vendorId, productId);
      await loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      await productApi.update(product.id, { is_active: !product.is_active });
      await loadProducts();
    } catch (error) {
      console.error("Failed to update product status:", error);
    }
  };

  const getPricingModelBadge = (model: PricingModel) => {
    const colors: Record<PricingModel, string> = {
      one_off: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      monthly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      pay_per_use: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[model]}`}>
        {model.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  const getPricingIcon = (model: PricingModel) => {
    switch (model) {
      case "one_off":
        return <DollarSign className="h-4 w-4" />;
      case "monthly":
        return <Calendar className="h-4 w-4" />;
      case "pay_per_use":
        return <Activity className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatPrice = (priceCents: number, model: PricingModel, billingDays?: number) => {
    const price = (priceCents / 100).toFixed(2);
    switch (model) {
      case "one_off":
        return `$${price} one-time`;
      case "monthly":
        return `$${price} every ${billingDays || 30} days`;
      case "pay_per_use":
        return `$${price} per use`;
      default:
        return `$${price}`;
    }
  };

  const ProductForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your product..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Help customers understand what they&apos;re purchasing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pricing_model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing Model *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="one_off">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      One-time Payment
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Monthly Subscription
                    </div>
                  </SelectItem>
                  <SelectItem value="pay_per_use">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Pay-per-use
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price_cents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (USD) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="10.00"
                  step="0.01"
                  min="0.01"
                  {...field}
                  onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) * 100))}
                  value={field.value ? (field.value / 100).toFixed(2) : ""}
                />
              </FormControl>
              <FormDescription>
                {pricingModel === "one_off" && "One-time payment amount"}
                {pricingModel === "monthly" && "Amount charged per billing cycle"}
                {pricingModel === "pay_per_use" && "Amount charged per usage"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {pricingModel === "monthly" && (
          <FormField
            control={form.control}
            name="billing_interval_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Interval (Days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  How often to charge the subscription (default: 30 days)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {pricingModel === "pay_per_use" && (
          <FormField
            control={form.control}
            name="usage_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Limit (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of uses allowed (leave empty for unlimited)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingProduct ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                {editingProduct ? "Update Product" : "Create Product"}
                <Package className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingProduct(null);
              form.reset();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/vendor/${vendorId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">
              Create and manage your product catalog
            </p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your catalog with pricing configuration
              </DialogDescription>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>
            Manage your product catalog and pricing models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Pricing Model</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPricingIcon(product.pricing_model || 'one_off')}
                      {getPricingModelBadge(product.pricing_model || 'one_off')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        ${(product.price_cents || 0 / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(product.price_cents || 0, product.pricing_model || 'one_off', product.billing_interval_days || 30)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProductStatus(product)}
                    >
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell>
                    {formatDistance(new Date(product.created_at), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id || '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="space-y-4">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">No products yet</p>
                        <p className="text-muted-foreground">
                          Create your first product to start accepting payments
                        </p>
                      </div>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Product
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product details and pricing configuration
            </DialogDescription>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
