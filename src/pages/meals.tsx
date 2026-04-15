import { useListMealStudent, useListMeals } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import DeleteMealButton from "@/components/custom/DeleteMealButton";
import CreateMealDialog from "@/components/custom/CreateMealDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export default function Meals() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { isUser } = useAuth();

  // 1. Generate a stable date string for API calls
  const selectedDateParam = useMemo(() => {
    const date = selectedDate ?? new Date();
    return format(date, "yyyy-MM-dd");
  }, [selectedDate]);

  // 2. List meals (API supports month/year/studentId params, not date)
  const { data: meals, isLoading } = useListMeals();

  const { data: students } = useListMealStudent({
    date: selectedDateParam,
  });

  // 3. Filter meals (Safe comparison using the same string format)
  const filteredMeals = useMemo(() => {
    if (!meals) return [];
    return meals.filter((meal) => {
      const mealDate = format(new Date(meal.date), "yyyy-MM-dd");
      return mealDate === selectedDateParam;
    });
  }, [meals, selectedDateParam]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
            Meals
          </h1>
          <p className="text-muted-foreground mt-1">
            Record daily meal consumption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-12 w-72 justify-between rounded-xl border-border/60 bg-background px-3 hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="flex min-w-0 flex-col items-start leading-tight">
                    <span className="text-xs text-muted-foreground">Meal date</span>
                    <span className="truncate font-medium">
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    datePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-90 sm:w-105 overflow-hidden rounded-xl border-border/60 p-0 shadow-xl"
            >
              <div className="border-b bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">Pick meal date</p>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDatePickerOpen(false);
                }}
                className="mx-auto p-4 text-base [&_button]:h-10 [&_button]:w-10"
                initialFocus
              />
              <div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDatePickerOpen(false)}
                >
                  Close
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {!isUser && (
            <CreateMealDialog
              open={createOpen}
              meals={meals || []}
              onOpenChange={setCreateOpen}
              selectedDate={selectedDate}
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
                {!isUser && <TableHead className="w-12.5"></TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                      {!isUser && <TableCell />}
                    </TableRow>
                  ))
              ) : filteredMeals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isUser ? 3 : 4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No meals logged for this date.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeals.map((meal) => (
                  <TableRow key={meal.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {format(new Date(meal.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {meal.studentName.charAt(0)}
                        </div>
                        {meal.studentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono bg-muted/20">
                      {meal.value}
                    </TableCell>
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