import { useListDeposits, useCreateDeposit, useDeleteDeposit, useListStudents, getListDepositsQueryKey } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Plus, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

const depositSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export default function Deposits() {
  const { data: deposits, isLoading } = useListDeposits();
  const { data: students } = useListStudents();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isUser } = useAuth();

  const filteredDeposits = useMemo(() => {
    if (!deposits) return [];
    const lower = search.toLowerCase();
    return deposits.filter(d => 
      d.studentName.toLowerCase().includes(lower) || 
      (d.note && d.note.toLowerCase().includes(lower))
    );
  }, [deposits, search]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Deposits</h1>
          <p className="text-muted-foreground mt-1">Manage student funds and payments.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deposits..."
              className="pl-9 bg-card"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!isUser && (
            <CreateDepositDialog 
              open={createOpen} 
              onOpenChange={setCreateOpen} 
              students={students || []} 
            />
          )}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {!isUser && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    {!isUser && <TableCell></TableCell>}
                  </TableRow>
                ))
              ) : filteredDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isUser ? 4 : 5} className="h-32 text-center text-muted-foreground">
                    {search ? "No deposits found matching your search." : "No deposits logged yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{format(new Date(deposit.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-secondary/50 flex items-center justify-center text-secondary-foreground text-xs font-bold">
                          {deposit.studentName.charAt(0)}
                        </div>
                        {deposit.studentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{deposit.note || "-"}</TableCell>
                    <TableCell className="text-right font-mono text-primary font-bold">
                      +${deposit.amount.toFixed(2)}
                    </TableCell>
                    {!isUser && (
                      <TableCell>
                        <DeleteDepositButton depositId={deposit.id} />
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

function CreateDepositDialog({ open, onOpenChange, students }: { open: boolean, onOpenChange: (open: boolean) => void, students: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createDeposit = useCreateDeposit();
  
  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: { 
      studentId: 0, 
      amount: 0,
      date: new Date().toISOString().split('T')[0], 
      note: ""
    },
  });

  const onSubmit = (values: z.infer<typeof depositSchema>) => {
    createDeposit.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepositsQueryKey() });
        toast({ title: "Deposit added", description: "The deposit has been successfully recorded." });
        onOpenChange(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add deposit.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Deposit</DialogTitle>
          <DialogDescription>Record a new payment from a student.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? field.value.toString() : ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.roomNumber})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0" placeholder="0.00" {...field} /></FormControl>
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
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl><Input placeholder="E.g. November meal advance" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeposit.isPending}>
                {createDeposit.isPending ? "Saving..." : "Save Deposit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDepositButton({ depositId }: { depositId: number }) {
  const queryClient = useQueryClient();
  const deleteDeposit = useDeleteDeposit();
  const { toast } = useToast();

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this deposit? This will affect the student's balance.")) {
      deleteDeposit.mutate({ depositId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDepositsQueryKey() });
          toast({ title: "Deposit deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete} disabled={deleteDeposit.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
