import { useGetBazarList, useCreateBazarItem, useDeleteBazarItem, useListStudents, getGetBazarListQueryKey } from "@/lib/api-client";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";

const bazarItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be > 0"),
  unit: z.string().min(1, "Unit is required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  studentIds: z.array(z.number()).min(1, "Select at least one student to share the cost"),
});

export default function BazarListDetails() {
  const { id } = useParams();
  const listId = parseInt(id || "0", 10);
  const { isUser } = useAuth();
  
  const { data: list, isLoading, error } = useGetBazarList(listId, { 
    query: { enabled: !!listId, queryKey: getGetBazarListQueryKey(listId) } 
  });

  const { data: students } = useListStudents();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !list) {
    return <div className="text-destructive">Failed to load bazar list.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/bazar" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bazar Lists
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">{list.title}</h1>
            <p className="text-muted-foreground mt-1">{format(new Date(list.date), "MMMM d, yyyy")}</p>
          </div>
          
          <Card className="w-full sm:w-auto bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <div className="text-2xl font-bold font-mono text-primary">
                  ${list.totalCost.toFixed(2)}
                </div>
              </div>
              <div className="h-10 w-px bg-border mx-2"></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items</p>
                <div className="text-2xl font-bold font-mono">
                  {list.itemCount}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shopping Items</CardTitle>
            <CardDescription>Items bought and how costs are shared.</CardDescription>
          </div>
          {!isUser && (
            <CreateBazarItemDialog 
              open={createOpen} 
              onOpenChange={setCreateOpen} 
              listId={list.id}
              students={students || []} 
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead>Shared Between</TableHead>
                <TableHead className="text-right">Cost/Person</TableHead>
                {!isUser && <TableHead className="w-12.5"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isUser ? 5 : 6} className="h-32 text-center text-muted-foreground">
                    No items added to this list yet.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.assignedStudents.map(s => (
                          <Badge key={s.id} variant="secondary" className="font-normal text-[10px]">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      ${item.sharedCostPerStudent.toFixed(2)}
                    </TableCell>
                    {!isUser && (
                      <TableCell>
                        <DeleteBazarItemButton listId={list.id} itemId={item.id} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateBazarItemDialog({ open, onOpenChange, listId, students }: { open: boolean, onOpenChange: (open: boolean) => void, listId: number, students: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createItem = useCreateBazarItem();
  
  const form = useForm<z.infer<typeof bazarItemSchema>>({
    resolver: zodResolver(bazarItemSchema),
    defaultValues: { 
      name: "",
      quantity: 1,
      unit: "kg",
      price: 0,
      studentIds: students.map(s => s.id) // Default to all
    },
  });

  const onSubmit = (values: z.infer<typeof bazarItemSchema>) => {
    createItem.mutate({ bazarListId: listId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBazarListQueryKey(listId) });
        toast({ title: "Item added", description: "The item has been added and costs shared." });
        onOpenChange(false);
        form.reset({
          name: "",
          quantity: 1,
          unit: "kg",
          price: 0,
          studentIds: students.map(s => s.id)
        });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
      }
    });
  };

  const toggleStudent = (id: number) => {
    const current = form.getValues("studentIds");
    if (current.includes(id)) {
      form.setValue("studentIds", current.filter(val => val !== id), { shouldValidate: true });
    } else {
      form.setValue("studentIds", [...current, id], { shouldValidate: true });
    }
  };

  const toggleAll = () => {
    const current = form.getValues("studentIds");
    if (current.length === students.length) {
      form.setValue("studentIds", [], { shouldValidate: true });
    } else {
      form.setValue("studentIds", students.map(s => s.id), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Shopping Item</DialogTitle>
          <DialogDescription>Add an item and select who shares its cost.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl><Input placeholder="E.g. Rice, Potatoes, Chicken" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl><Input placeholder="kg, liter, pieces" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Price ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium">Shared Between</p>
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll} className="h-6 px-2 text-xs">
                  {form.watch("studentIds").length === students.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-md p-3 max-h-37.5 overflow-y-auto grid grid-cols-2 gap-2 bg-muted/20">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`student-${student.id}`} 
                      checked={form.watch("studentIds").includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <label 
                      htmlFor={`student-${student.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {student.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-[0.8rem] text-destructive font-medium">
                {form.formState.errors.studentIds?.message}
              </p>
            </div>
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createItem.isPending}>
                {createItem.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBazarItemButton({ listId, itemId }: { listId: number, itemId: number }) {
  const queryClient = useQueryClient();
  const deleteItem = useDeleteBazarItem();
  const { toast } = useToast();

  const onDelete = () => {
    if (window.confirm("Delete this item? This will update student balances.")) {
      deleteItem.mutate({ bazarItemId: itemId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBazarListQueryKey(listId) });
          toast({ title: "Item deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete} disabled={deleteItem.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
