import { useToast } from "@/hooks/use-toast";
import {
  getListMealStudentQueryKey,
  getListMealsQueryKey,
  MealInputValue,
  StudentSummary,
  useCreateMeal,
} from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import z from "zod";

export const mealSchema = z.object({
  studentId: z.coerce.number().min(1, "Student is required"),
  date: z.string().min(1, "Date is required"),
  value: z
    .number()
    .refine(
      (value) => [0.5, 1, 1.5, 2, 2.5].includes(value),
      "Invalid meal value",
    ),
});
interface Imeals {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  value: number;
  createdAt: string;
}

export default function CreateMealDialog({
  open,
  onOpenChange,
  students,
  meals,
  selectedDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentSummary[];
  meals: Imeals[];
  selectedDate: Date | undefined;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMeal = useCreateMeal();

  const form = useForm<z.infer<typeof mealSchema>>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      studentId: 0,
      date: selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      value: MealInputValue.NUMBER_1,
    },
  });

  const onSubmit = (values: z.infer<typeof mealSchema>) => {
    createMeal.mutate(
      {
        data: {
          ...values,
          value: values.value as MealInputValue,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
          const dateParam = (selectedDate ?? new Date())
            .toISOString()
            .split("T")[0];
          queryClient.invalidateQueries({
            queryKey: getListMealStudentQueryKey(dateParam),
          });
          
          toast({
            title: "Meal added",
            description: "The meal entry has been saved.",
          });
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add meal.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add Meal</DialogTitle>
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
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name} ({s.roomNumber})
                        </SelectItem>
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
                  <FormControl>
                    <Input readOnly type="date" {...field} />
                  </FormControl>
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
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal value" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[0.5, 1, 1.5, 2, 2.5].map((mealValue) => (
                        <SelectItem
                          key={mealValue}
                          value={mealValue.toString()}
                        >
                          {mealValue} meals
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMeal.isPending}>
                {createMeal.isPending ? "Adding..." : "Add Meal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
