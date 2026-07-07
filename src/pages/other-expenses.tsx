import {
  useListOtherExpenses,
  useCreateOtherExpense,
  useUpdateOtherExpensePayments,
  useDeleteOtherExpense,
  useListStudents,
} from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Search, Printer, CheckCircle, XCircle, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";

const otherExpenseSchema = z.object({
  type: z.string().min(1, "Expense type/title is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
});

export default function OtherExpenses() {
  const { data: expenses, isLoading } = useListOtherExpenses();
  const { data: students } = useListStudents();
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [search, setSearch] = useState("");
  const { isUser } = useAuth();

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    const lower = search.toLowerCase();
    return expenses.filter(e => e.type.toLowerCase().includes(lower));
  }, [expenses, search]);

  const handlePrint = (expense: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const paidList = expense.payments.filter((p: any) => p.isPaid);
    const unpaidList = expense.payments.filter((p: any) => !p.isPaid);

    printWindow.document.write(`
      <html>
        <head>
          <title>Expense Payment Report - ${expense.type}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1f2937; }
            h1 { font-size: 28px; font-weight: 800; margin-bottom: 5px; color: #111827; font-family: Georgia, serif; }
            .meta { margin-bottom: 25px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; }
            .summary { display: flex; gap: 40px; margin-bottom: 35px; background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
            .summary-item { display: flex; flex-direction: column; }
            .summary-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; tracking-wider: 0.05em; }
            .summary-val { font-size: 20px; font-weight: 800; margin-top: 4px; color: #111827; }
            .text-green { color: #16a34a; }
            .text-red { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; border-radius: 8px; overflow: hidden; }
            th, td { border: 1px solid #e5e7eb; padding: 12px 16px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 700; color: #374151; font-size: 13px; text-transform: uppercase; }
            td { font-size: 14px; }
            .status { font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
            .status-paid { color: #16a34a; }
            .status-unpaid { color: #dc2626; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${expense.type}</h1>
          <div class="meta">Report Generated on: ${format(new Date(), "PPP")} | Expense Date: ${format(new Date(expense.date), "PPP")}</div>
          
          <div class="summary">
            <div class="summary-item">
              <span class="summary-label">Total Amount</span>
              <span class="summary-val">$${expense.amount.toFixed(2)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Paid Residents</span>
              <span class="summary-val text-green">${paidList.length} / ${expense.payments.length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Pending Residents</span>
              <span class="summary-val text-red">${unpaidList.length} / ${expense.payments.length}</span>
            </div>
          </div>

          <h2>Resident Payment Status</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Room Number</th>
                <th style="width: 50%">Resident Name</th>
                <th style="width: 25%">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              ${expense.payments
                .map(
                  (p: any) => `
                <tr>
                  <td><strong>Room ${p.user.roomNumber}</strong></td>
                  <td>${p.user.username}</td>
                  <td>
                    <span class="status ${p.isPaid ? "status-paid" : "status-unpaid"}">
                      ${p.isPaid ? "✓ Paid" : "✗ Not Paid"}
                    </span>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Other Expenses</h1>
          <p className="text-muted-foreground mt-1">Manage secondary bills (WiFi, utilities, rent, etc.) and track who paid.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-9 bg-card"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!isUser && (
            <CreateExpenseDialog 
              open={createOpen} 
              onOpenChange={setCreateOpen} 
              students={students || []} 
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="shadow-sm border border-border/50 bg-card/60 backdrop-blur-sm">
              <CardHeader className="space-y-2 pb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredExpenses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-xl border border-dashed flex flex-col items-center justify-center gap-2">
            <FileText className="h-10 w-10 text-muted-foreground/60" />
            <p className="font-medium text-lg">No expenses found</p>
            <p className="text-sm text-muted-foreground">Click "Add Expense" to create a new shared bill.</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const paidCount = expense.payments.filter(p => p.isPaid).length;
            const totalCount = expense.payments.length;
            const allPaid = paidCount === totalCount && totalCount > 0;

            return (
              <Card key={expense.id} className="shadow-sm border border-border/50 bg-card hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold font-serif text-primary truncate max-w-[200px]" title={expense.type}>
                        {expense.type}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      allPaid 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" 
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}>
                      {allPaid ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {paidCount}/{totalCount} Paid
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Amount</span>
                    <p className="text-2xl font-mono font-bold text-primary">${expense.amount.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {!isUser && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setManageOpen(true);
                        }}
                      >
                        Manage Payments
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handlePrint(expense)}
                      title="Print payment report"
                    >
                      <Printer className="h-4 w-4" />
                      {isUser && <span className="ml-2">Print Status</span>}
                    </Button>
                    {!isUser && (
                      <DeleteExpenseButton expenseId={expense.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedExpense && (
        <ManagePaymentsDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          expense={selectedExpense}
        />
      )}
    </div>
  );
}

function CreateExpenseDialog({ open, onOpenChange, students }: { open: boolean, onOpenChange: (open: boolean) => void, students: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createExpense = useCreateOtherExpense();
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  
  const form = useForm<z.infer<typeof otherExpenseSchema>>({
    resolver: zodResolver(otherExpenseSchema),
    defaultValues: { 
      type: "", 
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (values: z.infer<typeof otherExpenseSchema>) => {
    createExpense.mutate({ 
      data: {
        ...values,
        studentIds: selectedStudentIds
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["other-expenses"] });
        toast({ title: "Expense added", description: "The expense has been successfully recorded." });
        onOpenChange(false);
        form.reset();
        setSelectedStudentIds([]);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
      }
    });
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedStudentIds(students.map(s => s.id));
  };

  const selectNone = () => {
    setSelectedStudentIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Other Expense</DialogTitle>
          <DialogDescription>Record a new general expense and initial contributions.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-1 flex-1">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Title/Type</FormLabel>
                  <FormControl><Input placeholder="E.g. WiFi Bill November" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Who paid initially?</FormLabel>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={selectAll}>Select All</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={selectNone}>Clear</Button>
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 divide-y bg-muted/20">
                {students.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">No students available.</div>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`student-${student.id}`} 
                          checked={selectedStudentIds.includes(student.id)} 
                          onCheckedChange={() => toggleStudent(student.id)}
                        />
                        <label htmlFor={`student-${student.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          {student.name}
                        </label>
                      </div>
                      <span className="text-xs text-muted-foreground bg-card border px-1.5 py-0.5 rounded font-mono">
                        Room {student.roomNumber}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createExpense.isPending}>
                {createExpense.isPending ? "Saving..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ManagePaymentsDialog({ open, onOpenChange, expense }: { open: boolean, onOpenChange: (open: boolean) => void, expense: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updatePayments = useUpdateOtherExpensePayments(expense.id);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    expense.payments.filter((p: any) => p.isPaid).map((p: any) => p.userId)
  );
  const [search, setSearch] = useState("");

  const filteredPayments = useMemo(() => {
    const lower = search.toLowerCase();
    return expense.payments.filter((p: any) => 
      p.user.username.toLowerCase().includes(lower) || 
      String(p.user.roomNumber).includes(lower)
    );
  }, [expense.payments, search]);

  const toggleStudent = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(expense.payments.map((p: any) => p.userId));
  };

  const selectNone = () => {
    setSelectedIds([]);
  };

  const onSave = () => {
    updatePayments.mutate({ data: { studentIds: selectedIds } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["other-expenses"] });
        toast({ title: "Payments updated", description: "Contributions have been successfully updated." });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update payments.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Payments</DialogTitle>
          <DialogDescription>Update payment status for {expense.type} (${expense.amount.toFixed(2)}).</DialogDescription>
        </DialogHeader>
        
        <div className="relative my-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search residents..."
            className="pl-9 bg-card"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mb-2 justify-end">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={selectAll}>Select All</Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={selectNone}>Clear</Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md divide-y max-h-[350px] bg-muted/10 p-2">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No residents found.</div>
          ) : (
            filteredPayments.map((p: any) => (
              <div key={p.userId} className="flex items-center justify-between py-2 px-1 hover:bg-muted/20 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`payment-${p.userId}`} 
                    checked={selectedIds.includes(p.userId)} 
                    onCheckedChange={() => toggleStudent(p.userId)}
                  />
                  <label htmlFor={`payment-${p.userId}`} className="text-sm font-medium leading-none cursor-pointer flex flex-col gap-0.5">
                    <span>{p.user.username}</span>
                    <span className="text-xs text-muted-foreground font-normal">Room {p.user.roomNumber}</span>
                  </label>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  selectedIds.includes(p.userId)
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" 
                    : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"
                }`}>
                  {selectedIds.includes(p.userId) ? "Paid" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={updatePayments.isPending}>
            {updatePayments.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteExpenseButton({ expenseId }: { expenseId: number }) {
  const queryClient = useQueryClient();
  const deleteExpense = useDeleteOtherExpense();
  const { toast } = useToast();

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this expense? This cannot be undone.")) {
      deleteExpense.mutate({ id: expenseId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["other-expenses"] });
          toast({ title: "Expense deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
        }
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
      onClick={onDelete} 
      disabled={deleteExpense.isPending}
      title="Delete expense"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
