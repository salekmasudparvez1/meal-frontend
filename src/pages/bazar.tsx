import { useListBazarLists, useCreateBazarList, useDeleteBazarList, getListBazarListsQueryKey } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Plus, Trash2, Search, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const bazarListSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
});

export default function BazarLists() {
  const { data: bazarLists, isLoading } = useListBazarLists();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isUser } = useAuth();

  const filteredLists = useMemo(() => {
    if (!bazarLists) return [];
    const lower = search.toLowerCase();
    return bazarLists.filter(l => 
      l.title.toLowerCase().includes(lower)
    );
  }, [bazarLists, search]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Bazar</h1>
          <p className="text-muted-foreground mt-1">Manage shopping lists and shared costs.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lists..."
              className="pl-9 bg-card"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!isUser && <CreateBazarListDialog open={createOpen} onOpenChange={setCreateOpen} />}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : filteredLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {search ? "No bazar lists found matching your search." : "No bazar lists created yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLists.map((list) => (
                  <TableRow key={list.id} className="group hover:bg-muted/30 transition-colors cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/bazar/${list.id}`}>
                        {format(new Date(list.date), "MMM d, yyyy")}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/bazar/${list.id}`} className="font-medium hover:underline text-primary flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
                        {list.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{list.itemCount}</TableCell>
                    <TableCell className="text-right font-mono font-bold">${list.totalCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {!isUser && <DeleteBazarListButton listId={list.id} />}
                        <Link href={`/bazar/${list.id}`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
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

function CreateBazarListDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createBazarList = useCreateBazarList();
  
  const form = useForm<z.infer<typeof bazarListSchema>>({
    resolver: zodResolver(bazarListSchema),
    defaultValues: { 
      title: `Bazar_List_${format(new Date(), "MMM d, yyyy")}`,
      date: new Date().toISOString().split('T')[0], 
    },
  });

  const onSubmit = (values: z.infer<typeof bazarListSchema>) => {
    createBazarList.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBazarListsQueryKey() });
        toast({ title: "Bazar list created", description: "You can now add items to it." });
        onOpenChange(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create list.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Bazar List</DialogTitle>
          <DialogDescription>Start a new shopping list to track shared costs.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="E.g. Sunday Market" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createBazarList.isPending}>
                {createBazarList.isPending ? "Creating..." : "Create List"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBazarListButton({ listId }: { listId: number }) {
  const queryClient = useQueryClient();
  const deleteBazarList = useDeleteBazarList();
  const { toast } = useToast();

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this list and all its items? This will affect student balances.")) {
      deleteBazarList.mutate({ bazarListId: listId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBazarListsQueryKey() });
          toast({ title: "List deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} disabled={deleteBazarList.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
