import { useListMeals, useCreateMeal, useDeleteMeal, useListStudents, getListMealsQueryKey, MealInputValue } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Plus, Trash2, CalendarIcon } from "lucide-react";
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

const mealSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  date: z.string().min(1, "Date is required"),
  value: z.number().refine((value) => [0.5, 1, 1.5, 2, 2.5].includes(value), "Invalid meal value"),
});

export default function Meals() {
  const { data: meals, isLoading } = useListMeals();
  const { data: students } = useListStudents();
  const [createOpen, setCreateOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const { isUser } = useAuth();

  const filteredMeals = useMemo(() => {
    if (!meals) return [];
    return meals.filter(m => {
      const mealMonth = new Date(m.date).getMonth() + 1;
      return mealMonth === monthFilter;
    });
  }, [meals, monthFilter]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Meals</h1>
          <p className="text-muted-foreground mt-1">Record daily meal consumption.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={monthFilter.toString()} 
            onValueChange={(val) => setMonthFilter(parseInt(val))}
          >
            <SelectTrigger className="w-[140px] bg-card">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {format(new Date(2000, month - 1, 1), 'MMMM')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isUser && (
            <CreateMealDialog 
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
                <TableHead className="text-right">Value</TableHead>
                {!isUser && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    {!isUser && <TableCell></TableCell>}
                  </TableRow>
                ))
              ) : filteredMeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isUser ? 3 : 4} className="h-32 text-center text-muted-foreground">
                    No meals logged for this month.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeals.map((meal) => (
                  <TableRow key={meal.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{format(new Date(meal.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {meal.studentName.charAt(0)}
                        </div>
                        {meal.studentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono bg-muted/20">{meal.value}</TableCell>
                    {!isUser && (
                      <TableCell>
                        <DeleteMealButton mealId={meal.id} />
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

function CreateMealDialog({ open, onOpenChange, students }: { open: boolean, onOpenChange: (open: boolean) => void, students: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMeal = useCreateMeal();
  
  const form = useForm<z.infer<typeof mealSchema>>({
    resolver: zodResolver(mealSchema),
    defaultValues: { 
      studentId: 0, 
      date: new Date().toISOString().split('T')[0], 
      value: MealInputValue.NUMBER_1
    },
  });

  const onSubmit = (values: z.infer<typeof mealSchema>) => {
    createMeal.mutate({
      data: {
        ...values,
        value: values.value as MealInputValue,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
        toast({ title: "Meal added", description: "The meal entry has been saved." });
        onOpenChange(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add meal.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Log Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Meal</DialogTitle>
          <DialogDescription>Record a meal for a student.</DialogDescription>
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
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Value</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal value" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[0.5, 1, 1.5, 2, 2.5].map((mealValue) => (
                        <SelectItem key={mealValue} value={mealValue.toString()}>{mealValue} meals</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMeal.isPending}>
                {createMeal.isPending ? "Logging..." : "Log Meal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMealButton({ mealId }: { mealId: number }) {
  const queryClient = useQueryClient();
  const deleteMeal = useDeleteMeal();
  const { toast } = useToast();

  const onDelete = () => {
    if (window.confirm("Are you sure you want to delete this meal entry?")) {
      deleteMeal.mutate({ mealId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
          toast({ title: "Meal deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete} disabled={deleteMeal.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
